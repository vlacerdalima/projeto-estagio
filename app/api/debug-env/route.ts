import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const urlMatch = dbUrl.match(/@([^:/]+)/);
    const hostName = urlMatch ? urlMatch[1] : 'não encontrado';
    
    return NextResponse.json({
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0,
      hasDbHost: !!process.env.DB_HOST,
      hasDbName: !!process.env.DB_NAME,
      hasDbUser: !!process.env.DB_USER,
      hasDbPassword: !!process.env.DB_PASSWORD,
      hostName: hostName,
      // Primeiros e últimos 10 caracteres da URL (sem mostrar senha completa)
      databaseUrlPreview: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.substring(0, 30)}...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 30)}`
        : 'não definida'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao processar env',
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

