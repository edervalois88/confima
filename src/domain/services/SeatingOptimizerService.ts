import { DomainError } from '../errors/DomainError';

/**
 * @fileoverview Motor de Optimización de Asientos para Bodas.
 * Anillo 1: Domain.
 * Implementa una heurística de optimización para el problema de asignación de mesas con restricciones.
 */

export interface GuestGroup {
  id: string;
  size: number;
  affinities: string[]; // Qué otros IDs de grupos prefieren
}

export interface TableAssignment {
  tableId: number;
  groups: GuestGroup[];
  currentLoad: number;
}

export class OptimizationError extends DomainError {
  constructor(message: string) {
    super(message, 'OPTIMIZATION_ERROR');
    this.name = 'OptimizationError';
  }
}

export class SeatingOptimizerService {
  /**
   * Resuelve el problema de asignación de mesas maximizando afinidades y respetando capacidad.
   * Algoritmo: Greedy con refinamiento por intercambio (Local Search).
   * 
   * @param groups Lista de grupos de invitados.
   * @param tableCapacity Capacidad máxima 'm' por mesa.
   */
  public static optimize(groups: GuestGroup[], tableCapacity: number): TableAssignment[] {
    // 1. Validación de pre-condiciones
    const invalidGroups = groups.filter(g => g.size > tableCapacity);
    if (invalidGroups.length > 0) {
      throw new OptimizationError(`Existen grupos que exceden la capacidad individual de la mesa: ${invalidGroups.map(g => g.id).join(', ')}`);
    }

    // 2. Ordenamiento inicial (Heurística First-Fit Decreasing)
    const sortedGroups = [...groups].sort((a, b) => b.size - a.size);
    const tables: TableAssignment[] = [];

    // 3. Asignación inicial (Greedy)
    for (const group of sortedGroups) {
      let assigned = false;
      
      // Intentar meter en mesa existente
      for (const table of tables) {
        if (table.currentLoad + group.size <= tableCapacity) {
          table.groups.push(group);
          table.currentLoad += group.size;
          assigned = true;
          break;
        }
      }

      // Si no cabe, crear mesa nueva
      if (!assigned) {
        tables.push({
          tableId: tables.length + 1,
          groups: [group],
          currentLoad: group.size
        });
      }
    }

    // 4. Refinamiento por Afinidades (Local Search Simulado)
    // Intentamos intercambiar grupos entre mesas para poner amigos juntos
    this.refineAffinities(tables, tableCapacity);

    return tables;
  }

  /**
   * Refina el resultado para maximizar las afinidades declaradas.
   */
  private static refineAffinities(tables: TableAssignment[], capacity: number) {
    let improved = true;
    let iterations = 0;
    const MAX_ITER = 100;

    while (improved && iterations < MAX_ITER) {
      improved = false;
      iterations++;

      for (let i = 0; i < tables.length; i++) {
        for (let j = i + 1; j < tables.length; j++) {
          // Intentar intercambiar un grupo de T1 con uno de T2
          for (const g1 of tables[i].groups) {
            for (const g2 of tables[j].groups) {
              const weightBefore = this.calculateTableScore(tables[i]) + this.calculateTableScore(tables[j]);
              
              // Verificamos si el intercambio respeta la capacidad 'm'
              const canSwap = 
                (tables[i].currentLoad - g1.size + g2.size <= capacity) &&
                (tables[j].currentLoad - g2.size + g1.size <= capacity);

              if (canSwap) {
                // Intercambio temporal
                const weightAfter = this.calculateSwapScore(tables[i], g1, g2) + this.calculateSwapScore(tables[j], g2, g1);
                
                if (weightAfter > weightBefore) {
                  this.swap(tables[i], tables[j], g1, g2);
                  improved = true;
                }
              }
            }
          }
        }
      }
    }
  }

  private static calculateTableScore(table: TableAssignment): number {
    let score = 0;
    const groupIds = table.groups.map(g => g.id);
    for (const g of table.groups) {
      for (const affinity of g.affinities) {
        if (groupIds.includes(affinity)) score += 10; // Bonus por afinidad satisfecha
      }
    }
    return score;
  }

  private static calculateSwapScore(table: TableAssignment, out: GuestGroup, inbound: GuestGroup): number {
    const tempGroups = table.groups.filter(g => g.id !== out.id).concat(inbound);
    const groupIds = tempGroups.map(g => g.id);
    let score = 0;
    for (const g of tempGroups) {
      for (const affinity of g.affinities) {
        if (groupIds.includes(affinity)) score += 10;
      }
    }
    return score;
  }

  private static swap(t1: TableAssignment, t2: TableAssignment, g1: GuestGroup, g2: GuestGroup) {
    t1.groups = t1.groups.filter(g => g.id !== g1.id).concat(g2);
    t1.currentLoad = t1.currentLoad - g1.size + g2.size;
    t2.groups = t2.groups.filter(g => g.id !== g2.id).concat(g1);
    t2.currentLoad = t2.currentLoad - g2.size + g1.size;
  }
}
