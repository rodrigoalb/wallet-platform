/** Pedido de uma página de resultados (page começa em 1). */
export interface PageRequest {
  page: number;
  limit: number;
}

/** Uma página de resultados mais o total, para o cliente montar a paginação. */
export interface Page<T> {
  items: T[];
  total: number;
}
