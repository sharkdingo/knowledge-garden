import type {
  AlgorithmProblemDocument,
  AlgorithmProblemRepository,
  AlgorithmProblemSummary,
} from "../domain/content";

export class AlgorithmProblemService {
  constructor(private readonly repository: AlgorithmProblemRepository) {}

  async list(): Promise<AlgorithmProblemSummary[]> {
    return [...await this.repository.listAlgorithmProblems()];
  }

  listSearchable(): Promise<AlgorithmProblemSummary[]> {
    return this.list();
  }

  get(slug: string): Promise<AlgorithmProblemDocument | null> {
    return this.repository.findAlgorithmProblemBySlug(slug);
  }
}
