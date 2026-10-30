const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const roles = [
  { nombre: "Administrador", descripcion: "Usuario con capacidades absolutas en el sistema" },
  { nombre: "Funcionario", descripcion: "Usuario con capacidad de procesar solicitudes" },
];

const tiposSolicitud = [
  { nombre: "Archivo", descripcion: "Solicitud para archivar documentos" },
  { nombre: "Desarchivo", descripcion: "Solicitud para desarchivar documentos y enviarlos" },
  { nombre: "Desarchivo interno", descripcion: "Solicitud para desarchivar documentos a peticion de un juez" },
];

const estados = [
  { nombre: "Pendiente" },
  { nombre: "En Proceso" },
  { nombre: "Finalizada" },
  { nombre: "Cancelada" },
];

// upsert por nombre: el seed se puede ejecutar varias veces sin duplicar datos
async function main() {
  for (const rol of roles) {
    await prisma.rol.upsert({ where: { nombre: rol.nombre }, update: rol, create: rol });
  }

  for (const tipo of tiposSolicitud) {
    await prisma.tipoSolicitud.upsert({ where: { nombre: tipo.nombre }, update: tipo, create: tipo });
  }

  for (const estado of estados) {
    await prisma.estado.upsert({ where: { nombre: estado.nombre }, update: estado, create: estado });
  }

  console.log("Catalogos precargados: rol, tipo_solicitud, estado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
