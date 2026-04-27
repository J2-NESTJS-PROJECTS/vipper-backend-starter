import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as fs from 'node:fs';
import * as path from 'node:path';
import { SapService } from '../sap/sap.service';
import { GenerateMonthlyConsumptionDto } from './dto/generate-monthly-consumption.dto';
import { StatementsQueryDto } from './dto/statements-query.dto';
import { StatementResponseDto } from './dto/statement-response.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class StatementsService {
  private readonly logger = new Logger(StatementsService.name);

  constructor(private readonly sapService: SapService) {}

  async findAll(
    query: StatementsQueryDto,
  ): Promise<PaginatedResponseDto<StatementResponseDto>> {
    const { page = 1, limit = 20, customerId, cardId, year, month } = query;

    this.logger.debug(`Fetching statements from SAP with filters: ${JSON.stringify(query)}`);

    const { statements, total } = await this.sapService.getStatements(
      { customerId, cardId, year, month },
      page,
      limit,
    );

    const mapped = statements.map((s) => this.mapToDto(s));
    return new PaginatedResponseDto(mapped, total, page, limit);
  }

  async getMonthlyConsumption(
    request: GenerateMonthlyConsumptionDto,
  ): Promise<{ fileName: string; content: Buffer }> {
    if (!request.customerId) {
      throw new BadRequestException('customerId is required');
    }

    // Generar MMYYYY (ej: 042026)
    const cutoffDate = `${request.month.toString().padStart(2, '0')}${request.year}`;

    this.logger.debug(
      `Generating account statement PDF from SAP: ${JSON.stringify({
        ...request,
        cutoffDate,
      })}`,
    );

    const statement = await this.sapService.getAccountStatement({
      customerId: request.customerId,
      cutoffDate,
    });

    if (!statement.header) {
      throw new NotFoundException('Account statement not found in SAP');
    }

    return {
      fileName: `estado-cuenta-${request.customerId}-${cutoffDate}.pdf`,
      content: await this.buildAccountStatementPdf(statement, request.year, request.month),
    };
  }

  private async buildAccountStatementPdf(
    statement: {
      period: string;
      identification: string;
      header: any;
      details: any[];
    },
    year: number,
    month: number,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 20 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const header = statement.header || {};
      const details = (statement.details || []).filter((item: any) =>
        Boolean((item?.SGTXT || '').toString().trim()),
      );

      const toMoney = (value: any) => this.parseAmount(value).toFixed(2);

      const creditLimit = this.parseAmount(header.CUPTR);
      const overdueBalance = this.parseAmount(header.VLVEN);
      const minimumRotative = this.parseAmount(header.VLROT);
      const deferredInstallment = this.parseAmount(header.VLDIF);
      const monthlyCharges = this.parseAmount(header.VLCAR);
      const deferredTotal = this.parseAmount(header.DIFTR);
      const minimumPayment = overdueBalance + minimumRotative + deferredInstallment + monthlyCharges;
      const usedCredit = minimumPayment + deferredTotal;
      const availableCredit = creditLimit - usedCredit;

      const issueDate = `15-${month.toString().padStart(2, '0')}-${year}`;
      const maxPaymentDate = this.formatDisplayDate((header.FECPA || '').toString().trim());

      const page = {
        left: 20,
        right: 575,
      };

      const drawCell = (
        x: number,
        y: number,
        w: number,
        h: number,
        text: string,
        align: 'left' | 'center' | 'right' = 'left',
        bold = false,
        fontSize = 9,
      ) => {
        doc.rect(x, y, w, h).stroke();
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
        doc.text(text || '', x + 4, y + 4, { width: w - 8, align, lineBreak: false });
      };

      doc.lineWidth(1).strokeColor('#000000').fillColor('#000000');

      doc.font('Helvetica-Bold').fontSize(12).text('ESTADO DE CUENTA', 25, 22);
      const logoPath = this.resolveDirectaLogoPath();
      if (logoPath) {
        doc.image(logoPath, 24, 36, { width: 160 });
      } else {
        doc.font('Helvetica-Bold').fontSize(40).fillColor('#0a3a78').text('DIRECTA', 24, 36);
      }
      doc.fillColor('#000000');

      const infoX = 285;
      const infoY = 22;
      const infoW = 290;
      const infoRowH = 18;
      const labelW = 70;

      drawCell(infoX, infoY, labelW, infoRowH, 'CLIENTE', 'left', true, 10);
      drawCell(infoX + labelW, infoY, infoW - labelW, infoRowH, (header.KUNNR || '').toString().trim(), 'left');
      drawCell(infoX, infoY + infoRowH, labelW, infoRowH, 'NOMBRE', 'left', true, 10);
      drawCell(
        infoX + labelW,
        infoY + infoRowH,
        infoW - labelW,
        infoRowH,
        (header.NOMBR || '').toString().trim(),
        'left',
      );
      drawCell(infoX, infoY + infoRowH * 2, labelW, infoRowH, 'EMAIL', 'left', true, 10);
      drawCell(
        infoX + labelW,
        infoY + infoRowH * 2,
        infoW - labelW,
        infoRowH,
        (header.EMAIL || '').toString().trim(),
        'left',
      );
      drawCell(infoX, infoY + infoRowH * 3, labelW, infoRowH, 'TEL', 'left', true, 10);
      drawCell(
        infoX + labelW,
        infoY + infoRowH * 3,
        infoW - labelW,
        infoRowH,
        (header.TELEF || '').toString().trim(),
        'left',
      );

      doc.font('Helvetica-Bold').fontSize(10).text('NRO. DE LA TARJETA', 420, 100, {
        width: 155,
        align: 'center',
        lineBreak: false,
      });
      drawCell(420, 110, 155, 18, this.maskCard((header.NUMTR || '').toString().trim()), 'center');

      const leftSummaryX = 138;
      const leftValueX = 250;
      const rightSummaryX = 360;
      const rightValueX = 492;
      const summaryY = 148;
      const summaryRowH = 20;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('CUPO APROBADO', leftSummaryX, summaryY + 4, { width: 120, align: 'left' });
      drawCell(leftValueX, summaryY, 85, summaryRowH, toMoney(creditLimit), 'right', false, 10);
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('CUPO UTILIZADO', leftSummaryX, summaryY + summaryRowH + 4, { width: 120, align: 'left' });
      drawCell(leftValueX, summaryY + summaryRowH, 85, summaryRowH, toMoney(usedCredit), 'right', false, 10);

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('CUPO DISPONIBLE', leftSummaryX, summaryY + summaryRowH * 2 + 4, { width: 120, align: 'left' });
      drawCell(leftValueX, summaryY + summaryRowH * 2, 85, summaryRowH, toMoney(availableCredit), 'right', false, 10);

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('FECHA EMISION', rightSummaryX, summaryY + 4, { width: 130, align: 'left' });
      drawCell(rightValueX, summaryY, 83, summaryRowH, issueDate, 'right', false, 10);

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('FECHA MAXIMA DE PAGO', rightSummaryX, summaryY + summaryRowH + 4, {
        width: 130,
        align: 'left',
      });
      drawCell(rightValueX, summaryY + summaryRowH, 83, summaryRowH, maxPaymentDate, 'right', false, 10);

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('MINIMO A PAGAR', rightSummaryX, summaryY + summaryRowH * 2 + 4, { width: 130, align: 'left' });
      drawCell(rightValueX, summaryY + summaryRowH * 2, 83, summaryRowH, toMoney(minimumPayment), 'right', false, 10);

      const tableX = page.left;
      const tableY = 212;
      const tableW = page.right - page.left;
      const tableBottomY = 676;
      const tableH = tableBottomY - tableY;
      const headerH = 24;
      const rowH = 20;
      const colW = [81, 81, 216, 81, 96];
      const colX = [tableX, tableX + colW[0], tableX + colW[0] + colW[1], tableX + colW[0] + colW[1] + colW[2], tableX + colW[0] + colW[1] + colW[2] + colW[3]];

      doc.rect(tableX, tableY, tableW, tableH).stroke();
      doc.moveTo(tableX, tableY + headerH).lineTo(tableX + tableW, tableY + headerH).stroke();

      for (let i = 1; i < colW.length; i += 1) {
        const x = tableX + colW.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.moveTo(x, tableY).lineTo(x, tableY + tableH).stroke();
      }

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('FECHA', colX[0], tableY + 8, { width: colW[0], align: 'center' });
      doc.text('REFERENCIA', colX[1], tableY + 8, { width: colW[1], align: 'center' });
      doc.text('DESCRIPCION', colX[2], tableY + 8, { width: colW[2], align: 'center' });
      doc.text('VALOR', colX[3], tableY + 8, { width: colW[3], align: 'center' });
      doc.text('SALDO DIFERIDO', colX[4], tableY + 8, { width: colW[4], align: 'center' });

      const maxRows = Math.floor((tableH - headerH - 10) / rowH);
      const printableDetails = details.slice(0, maxRows);

      doc.font('Helvetica').fontSize(10);
      printableDetails.forEach((item: any, index: number) => {
        const y = tableY + headerH + 7 + index * rowH;
        const description = (item.SGTXT || '').toString().trim();
        const isBalanceLine = description.includes('*** SALDO');
        const dateValue = isBalanceLine ? '' : this.formatDisplayDate((item.BLDAT || '').toString().trim());
        const reference = isBalanceLine ? '' : (item.XBLNR || '').toString().trim();

        doc.text(dateValue, colX[0] + 2, y, { width: colW[0] - 4, align: 'center', lineBreak: false });
        doc.text(reference, colX[1] + 2, y, { width: colW[1] - 4, align: 'center', lineBreak: false });
        doc.text(description, colX[2] + 4, y, { width: colW[2] - 8, align: 'left', lineBreak: false });
        doc.text(toMoney(item.DMBTR), colX[3] + 2, y, { width: colW[3] - 8, align: 'right', lineBreak: false });
        doc.text(toMoney(item.SALTR), colX[4] + 2, y, { width: colW[4] - 8, align: 'right', lineBreak: false });
      });

      const collectorY = 686;
      const collectorLabelW = 150;
      const collectorValueW = 405;
      const collectorRowH = 18;

      drawCell(page.left, collectorY, collectorLabelW, collectorRowH, 'EJECUTIVO DE COBRANZA', 'left', true, 10);
      drawCell(
        page.left + collectorLabelW,
        collectorY,
        collectorValueW,
        collectorRowH,
        (header.DCOBR || '').toString().trim(),
        'left',
        false,
        10,
      );
      drawCell(page.left, collectorY + collectorRowH, collectorLabelW, collectorRowH, 'EMAIL', 'left', true, 10);
      drawCell(
        page.left + collectorLabelW,
        collectorY + collectorRowH,
        collectorValueW,
        collectorRowH,
        (header.PMAIL || '').toString().trim(),
        'left',
        false,
        10,
      );
      drawCell(page.left, collectorY + collectorRowH * 2, collectorLabelW, collectorRowH, 'CONTACTO', 'left', true, 10);
      drawCell(
        page.left + collectorLabelW,
        collectorY + collectorRowH * 2,
        collectorValueW,
        collectorRowH,
        (header.TELFAS || '').toString().trim(),
        'left',
        false,
        10,
      );

      const totalsY = 744;
      const totalsW = page.right - page.left;
      const totalsH = 48;
      const totalsColW = totalsW / 5;

      doc.rect(page.left, totalsY, totalsW, totalsH).stroke();
      doc.moveTo(page.left, totalsY + 22).lineTo(page.right, totalsY + 22).stroke();
      for (let i = 1; i < 5; i += 1) {
        const x = page.left + totalsColW * i;
        doc.moveTo(x, totalsY).lineTo(x, totalsY + totalsH).stroke();
      }

      const totalHeaders = [
        'VALOR VENCIDO',
        'MINIMO ROTATIVO',
        'CUOTA DIFERIDA',
        'CARGOS DEL MES',
        'MINIMO A PAGAR',
      ];
      const totalValues = [
        toMoney(overdueBalance),
        toMoney(minimumRotative),
        toMoney(deferredInstallment),
        toMoney(monthlyCharges),
        toMoney(minimumPayment),
      ];

      doc.font('Helvetica-Bold').fontSize(10);
      totalHeaders.forEach((value, index) => {
        doc.text(value, page.left + totalsColW * index, totalsY + 6, {
          width: totalsColW,
          align: 'center',
        });
      });

      doc.font('Helvetica-Bold').fontSize(11);
      totalValues.forEach((value, index) => {
        doc.text(value, page.left + totalsColW * index, totalsY + 29, {
          width: totalsColW,
          align: 'center',
        });
      });

      doc.font('Helvetica').fontSize(6);
      doc.text(
        'Estimado cliente, favor verificar la informacion aqui incluida. Si hubiera alguna anomalia informar a los Telfs.: 1-800-DIRECT (347328) / (04) 600-5220 Ext. 686 - 688 o escribanos a info@directacredit.com / Km 2.5 Via Samborondon y Celeste Blacio Rendon, Almacenes Juan Eljuri. www.directacredit.com',
        page.left,
        804,
        { width: totalsW, align: 'center' },
      );

      doc.end();
    });
  }

  private parseAmount(value: any): number {
    const parsed = Number.parseFloat((value || '0').toString().replace(/,/g, ''));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private toPeriod(month: number, year: number): string {
    return `${month.toString().padStart(2, '0')}${year}`;
  }

  private maskCard(cardNumber: string): string {
    if (!cardNumber) return '';
    if (cardNumber.length <= 10) return cardNumber;
    return `${cardNumber.slice(0, 6)}XXXXXX${cardNumber.slice(-4)}`;
  }

  private formatDisplayDate(raw: string): string {
    if (!raw || raw === '00000000' || raw === '99991231') return '';
    if (!/^\d{8}$/.test(raw)) return raw;

    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    return `${day}-${month}-${year}`;
  }

  private resolveDirectaLogoPath(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'src/assets/img/directa.png'),
      path.resolve(process.cwd(), 'dist/assets/img/directa.png'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }

  private mapToDto(s: any): StatementResponseDto {
    return {
      id: s.id,
      cardId: s.cardId,
      customerId: s.customerId,
      period: s.period,
      year: s.year,
      month: s.month,
      openingBalance: s.openingBalance,
      closingBalance: s.closingBalance,
      totalCharges: s.totalCharges,
      totalPayments: s.totalPayments,
      minimumPayment: s.minimumPayment,
      dueDate: s.dueDate,
      currency: s.currency,
      status: s.status,
    };
  }
}
