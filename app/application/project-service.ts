import type { Project, ProjectRepository, ProjectStatus } from "../domain/content";

export type ProjectStatusSummary = Record<ProjectStatus, number>;

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  async list(): Promise<Project[]> {
    return [...await this.repository.listProjects()];
  }

  async getStatusSummary(): Promise<ProjectStatusSummary> {
    return (await this.list()).reduce<ProjectStatusSummary>(
      (summary, project) => ({ ...summary, [project.status]: (summary[project.status] ?? 0) + 1 }),
      {},
    );
  }
}
