# Introduction 
TODO: Give a short introduction of your project. Let this section explain the objectives or the motivation behind this project. 

# Getting Started
TODO: Guide users through getting your code up and running on their own system. In this section you can talk about:
1.	Installation process
2.	Software dependencies
3.	Latest releases
4.	API references

# Build and Test
TODO: Describe and show how to build your code and run the tests. 

# Contribute
TODO: Explain how other users and developers can contribute to make your code better. 

If you want to learn more about creating good readme files then refer the following [guidelines](https://docs.microsoft.com/en-us/azure/devops/repos/git/create-a-readme?view=azure-devops). You can also seek inspiration from the below readme files:
- [ASP.NET Core](https://github.com/aspnet/Home)
- [Visual Studio Code](https://github.com/Microsoft/vscode)
- [Chakra Core](https://github.com/Microsoft/ChakraCore)


Ejecutar seed 

Cómo ejecutarlo con tu usuario unitystores
Opción 1: generando key/token automáticamente
SEED_API_CREDENTIAL_USER=unitystores npm run prisma:seed:api-credential

Opción 2: definiendo tus propios valores
SEED_API_CREDENTIAL_USER=unitystores SEED_API_CREDENTIAL_NAME=VTEX SEED_API_CREDENTIAL_KEY=mi_key_segura SEED_API_CREDENTIAL_TOKEN=mi_token_seguro npm run prisma:seed:api-credential

Opción 3: con expiración
SEED_API_CREDENTIAL_USER=unitystores SEED_API_CREDENTIAL_NAME=VTEX SEED_API_CREDENTIAL_EXPIRES_AT=2026-12-31T23:59:59Znpm run prisma:seed:api-credential



npm install    
npm run prisma:migrate:prod
npm run prisma:generate    
npm run build     
sudo scp -r prisma administrador@172.16.0.22:/var/www/BackendOfficial/
sudo scp -r dist administrador@172.16.0.22:/var/www/BackendOfficial/



