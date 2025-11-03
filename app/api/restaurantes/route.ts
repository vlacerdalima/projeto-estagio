import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/lib/db';
import { normalizeData } from '@/lib/utils';

export async function GET() {
  try {
    // Obter usuário autenticado completo (incluindo email)
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userEmail = user.emailAddresses[0]?.emailAddress || '';
    const userId = user.id;

    // USUÁRIOS PERMITIDOS (whitelist)
    const ALLOWED_USERS = {
      'dev@nola.br': 'DEV', // Acesso total
    };

    // Verificar se o usuário está na whitelist
    const userType = ALLOWED_USERS[userEmail as keyof typeof ALLOWED_USERS];

    if (userType === 'DEV') {
      // DEV tem acesso TOTAL a todos os restaurantes
      const result = await pool.query(
        'SELECT id, name FROM stores ORDER BY name'
      );
      return NextResponse.json(normalizeData(result.rows));
    }

    // Para todos os outros usuários, verificar se tem registros na tabela
    let userRestaurants = [];
    try {
      const restrictionsResult = await pool.query(
        'SELECT COUNT(*) as count FROM user_restaurants WHERE clerk_user_id = $1',
        [userId]
      );
      const hasRecordsInTable = parseInt(restrictionsResult.rows[0].count) > 0;

      if (hasRecordsInTable) {
        // Usuário TEM registros = usuário NORMAL com restrições específicas
        const result = await pool.query(
          `SELECT s.id, s.name 
           FROM stores s
           INNER JOIN user_restaurants ur ON s.id = ur.store_id
           WHERE ur.clerk_user_id = $1
           ORDER BY s.name`,
          [userId]
        );
        userRestaurants = result.rows;
      }
      // Se não tem registros, userRestaurants fica vazio (sem acesso)
    } catch (tableError) {
      // Tabela user_restaurants não existe ainda - sem acesso
      console.log('Tabela user_restaurants não encontrada - sem acesso');
    }

    return NextResponse.json(normalizeData(userRestaurants));
  } catch (error) {
    console.error('Erro ao buscar restaurantes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar restaurantes' },
      { status: 500 }
    );
  }
}

