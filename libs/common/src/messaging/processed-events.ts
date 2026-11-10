/**
 * Memória dos eventIds já processados, para ignorar entregas duplicadas.
 * Fica em memória e com tamanho limitado (os mais antigos saem primeiro).
 * Suficiente para a demonstração; com várias réplicas ou reinícios seria
 * preciso um armazenamento compartilhado (ex.: Redis ou DynamoDB).
 */
export class ProcessedEvents {
  private readonly ids = new Set<string>();

  constructor(private readonly capacity = 10_000) {}

  has(eventId: string): boolean {
    return this.ids.has(eventId);
  }

  add(eventId: string): void {
    this.ids.add(eventId);
    if (this.ids.size > this.capacity) {
      // Set mantém a ordem de inserção: o primeiro é o mais antigo.
      const oldest = this.ids.values().next().value as string;
      this.ids.delete(oldest);
    }
  }
}
