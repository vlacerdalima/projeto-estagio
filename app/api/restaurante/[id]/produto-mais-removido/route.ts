import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildDateFilter } from '@/lib/dateFilter';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // NOTA: Funcionalidade temporariamente desativada
    // A equipe de desenvolvimento ainda não forneceu informações sobre a estrutura correta
    // do banco de dados para esta funcionalidade. Mantendo a lógica mas não executando queries.
    return NextResponse.json({
      nome: null,
      total: 0
    });

    /* CÓDIGO ORIGINAL MANTIDO PARA REFERÊNCIA - NÃO EXECUTA
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'anual';
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    
    const { filter: filterClause, params: dateParams } = buildDateFilter(year, month, period, 's.');
    
    // Tenta diferentes estruturas possíveis para produtos removidos
    const queries = [
      // Tenta item_product_sales com additional_price < 0 (preço adicional negativo = remoção)
      {
        sql: `SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN items i ON ips.item_id = i.id 
              WHERE s.store_id = $1 AND ips.additional_price < 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_product_sales (additional_price < 0) + items - REMOÇÕES'
      },
      // Tenta item_product_sales com price < 0 (preço negativo indica remoção)
      {
        sql: `SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN items i ON ips.item_id = i.id 
              WHERE s.store_id = $1 AND ips.price < 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_product_sales (price < 0) + items - REMOÇÕES'
      },
      // Tenta item_product_sales com additional_price = 0 E price = 0 (removido gratuitamente)
      {
        sql: `SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN items i ON ips.item_id = i.id 
              WHERE s.store_id = $1 AND ips.additional_price = 0 AND ips.price = 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_product_sales (additional_price=0 AND price=0) + items'
      },
      // Tenta item_product_sales com quantity < 0 (quantidade negativa indica remoção)
      {
        sql: `SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN items i ON ips.item_id = i.id 
              WHERE s.store_id = $1 AND ips.quantity < 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_product_sales (quantity < 0) + items'
      },
      // Tenta item_product_sales com amount < 0
      {
        sql: `SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN items i ON ips.item_id = i.id 
              WHERE s.store_id = $1 AND ips.amount < 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_product_sales (amount < 0) + items'
      },
      // Tenta item_item_product_sales (customizações nested) com price = 0
      {
        sql: `SELECT i.name as nome_produto, COUNT(iips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN item_item_product_sales iips ON ips.id = iips.item_product_sale_id 
              JOIN items i ON iips.item_id = i.id 
              WHERE s.store_id = $1 AND iips.price = 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_item_product_sales (price=0) + items'
      },
      // Tenta item_item_product_sales com quantity < 0
      {
        sql: `SELECT i.name as nome_produto, COUNT(iips.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
              JOIN item_item_product_sales iips ON ips.id = iips.item_product_sale_id 
              JOIN items i ON iips.item_id = i.id 
              WHERE s.store_id = $1 AND iips.quantity < 0 ${filterClause}
              GROUP BY i.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'item_item_product_sales (quantity < 0) + items'
      },
      // Tenta product_sales com total_price = 0 (valor zero pode indicar remoção)
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.total_price = 0 AND ps.quantity > 0 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (total_price=0) + products'
      },
      // Tenta product_sales com quantity negativa (remoção)
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.quantity < 0 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (quantity < 0) + products'
      },
      // Tenta product_sales com status ou state = 'removed'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.status = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (status=removed) + products'
      },
      // Tenta product_sales com state = 'removed'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.state = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (state=removed) + products'
      },
      // Tenta product_sales com campo 'type' ou 'action' = 'removed'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.type = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (type=removed) + products'
      },
      // Tenta product_sales com campo 'action' = 'removed'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.action = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (action=removed) + products'
      },
      // Tenta product_sales com campo 'modification_type' = 'removed'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.modification_type = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (modification_type=removed) + products'
      },
      // Tenta product_sales com campo 'operation' = 'remove'
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.operation = 'remove' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (operation=remove) + products'
      },
      // Tenta product_sales com quantity negativa (remoção)
      {
        sql: `SELECT p.name as nome_produto, COUNT(ps.id) as total_removido 
              FROM sales s 
              JOIN product_sales ps ON s.id = ps.sale_id 
              JOIN products p ON ps.product_id = p.id 
              WHERE s.store_id = $1 AND ps.quantity < 0 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_sales (quantity < 0) + products'
      },
      // Tenta product_modifications (tabela de modificações)
      {
        sql: `SELECT p.name as nome_produto, COUNT(pm.id) as total_removido 
              FROM sales s 
              JOIN product_modifications pm ON s.id = pm.sale_id 
              JOIN products p ON pm.product_id = p.id 
              WHERE s.store_id = $1 AND pm.type = 'removed' ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'product_modifications (type=removed) + products'
      },
      // Tenta sale_items com campo removed
      {
        sql: `SELECT p.name as nome_produto, COUNT(si.id) as total_removido 
              FROM sales s 
              JOIN sale_items si ON s.id = si.sale_id 
              JOIN products p ON si.product_id = p.id 
              WHERE s.store_id = $1 AND si.removed = true ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'sale_items (removed=true) + products'
      },
      // Tenta removed_products (tabela específica)
      {
        sql: `SELECT p.name as nome_produto, COUNT(rp.id) as total_removido 
              FROM sales s 
              JOIN removed_products rp ON s.id = rp.sale_id 
              JOIN products p ON rp.product_id = p.id 
              WHERE s.store_id = $1 ${filterClause}
              GROUP BY p.name 
              ORDER BY total_removido DESC 
              LIMIT 1`,
        name: 'removed_products + products'
      }
    ];

    for (const query of queries) {
      try {
        const result = await pool.query(query.sql, [id, ...dateParams]);
        if (result.rows.length > 0 && result.rows[0].nome_produto) {
          return NextResponse.json({
            nome: result.rows[0].nome_produto,
            total: parseInt(result.rows[0].total_removido) || 0
          });
        }
      } catch (err: any) {
        // Se a query falhar, tenta a próxima
        continue;
      }
    }

    // Se nenhuma query funcionou, tenta uma query fallback
    try {
      const fallbackQuery = `
        SELECT i.name as nome_produto, COUNT(ips.id) as total_removido 
        FROM sales s 
        JOIN product_sales ps ON s.id = ps.sale_id 
        JOIN item_product_sales ips ON ps.id = ips.product_sale_id 
        JOIN items i ON ips.item_id = i.id 
        WHERE s.store_id = $1 
        AND (ips.additional_price = 0 OR ips.price = 0)
        AND ips.quantity > 0
        ${filterClause}
        GROUP BY i.name 
        ORDER BY total_removido DESC 
        LIMIT 1
      `;
      const fallbackResult = await pool.query(fallbackQuery, [id, ...dateParams]);
      if (fallbackResult.rows.length > 0 && fallbackResult.rows[0].nome_produto) {
        return NextResponse.json({
          nome: fallbackResult.rows[0].nome_produto,
          total: parseInt(fallbackResult.rows[0].total_removido) || 0
        });
      }
    } catch (err: any) {
      // Ignora erro e continua
    }

    // Se nenhuma query funcionou, retorna null
    return NextResponse.json({
      nome: null,
      total: 0
    });
    */
  } catch (error) {
    console.error('❌ Erro ao buscar produto mais removido:', error);
    return NextResponse.json({
      nome: null,
      total: 0
    });
  }
}

