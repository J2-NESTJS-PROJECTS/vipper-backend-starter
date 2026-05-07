import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
  ApiSecurity,
} from "@nestjs/swagger";
import { CustomersService } from "./customers.service";
import { CustomerResponseDto } from "./dto/customer-response.dto";
import { CustomerPointsResponseDto } from "./dto/customer-points-response.dto";
import { Permissions } from "../common/decorators/permissions.decorator";
import { RoleType } from "@prisma/client";
import { Roles } from "@common/decorators/roles.decorator";

@ApiTags("customers")
@ApiBearerAuth("access-token")
@ApiSecurity('x-api-key')
@ApiSecurity('x-api-token')
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get(":id/points")
  //@Permissions({ action: "read", resource: "customers" })
  @Roles(RoleType.API_CLIENT, RoleType.SUPER_ADMIN,RoleType.ADMIN)
  @ApiOperation({ summary: "Get current customer points from SAP" })
  @ApiParam({ name: "id", description: "Customer identification (CEDULA)" })
  @ApiResponse({
    status: 200,
    description: "Customer points data",
    type: CustomerPointsResponseDto,
  })
  @ApiResponse({ status: 404, description: "Customer not found" })
  @ApiResponse({ status: 502, description: "SAP RFC error" })
  async findPointsById(
    @Param("id") id: string,
  ): Promise<CustomerPointsResponseDto> {
    const resp = await this.customersService.findPointsById(id);
    //console.log(resp);
    return resp;
  }

  @Get(":id")
  @Permissions({ action: "read", resource: "customers" })
  @ApiOperation({ summary: "Get customer by ID from SAP" })
  @ApiParam({ name: "id", description: "Customer identification (CEDULA)" })
  @ApiResponse({
    status: 200,
    description: "Customer data",
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: "Customer not found" })
  @ApiResponse({ status: 502, description: "SAP RFC error" })
  findById(@Param("id") id: string): Promise<CustomerResponseDto> {
    return this.customersService.findById(id);
  }

  // @Get(':id/cards')
  // @Permissions({ action: 'read', resource: 'cards' })
  // @ApiOperation({ summary: 'Get all cards for a customer from SAP' })
  // @ApiParam({ name: 'id', description: 'SAP Customer ID (KUNNR)' })
  // @ApiResponse({ status: 200, description: 'List of cards', type: [CardResponseDto] })
  // @ApiResponse({ status: 404, description: 'Customer not found' })
  // @ApiResponse({ status: 502, description: 'SAP RFC error' })
  // findCustomerCards(@Param('id') id: string): Promise<CardResponseDto[]> {
  //   return this.customersService.findCustomerCards(id);
  // }
}
