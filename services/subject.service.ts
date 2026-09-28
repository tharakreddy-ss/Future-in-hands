import { db } from "@/lib/db";

export type SubjectPage = { page: number; text: string };
export type SubjectUnitInput = {
  name: string;
  pageStart?: number | null;
  pageEnd?: number | null;
  topics: Array<{ name: string; pageStart?: number | null; pageEnd?: number | null }>;
};

export const subjectService = {
  list(institutionId: string) {
    return db.subject.findMany({
      where: { institutionId },
      include: {
        _count: { select: { classes: true, tests: true } },
        units: { include: { topics: true }, orderBy: { order: "asc" } },
      },
      orderBy: { name: "asc" },
    });
  },

  get(id: string, institutionId: string) {
    return db.subject.findFirst({
      where: { id, institutionId },
      include: {
        classes: { include: { class: true } },
        units: { include: { topics: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
    });
  },

  async create(input: {
    institutionId: string;
    createdById: string;
    name: string;
    code?: string;
    gradeLevel?: string;
    curriculum?: string;
    academicYear?: string;
    description?: string;
    syllabusFileKey?: string;
    syllabusFileName?: string;
    syllabusPages?: SubjectPage[];
    materialFileKey?: string;
    materialFileName?: string;
    materialPages?: SubjectPage[];
  }) {
    const syllabusPages = input.syllabusPages ?? [];
    const units = syllabusPages.length ? detectUnits(syllabusPages) : [];
    return db.subject.create({
      data: {
        institutionId: input.institutionId,
        createdById: input.createdById,
        name: input.name,
        code: input.code,
        gradeLevel: input.gradeLevel,
        curriculum: input.curriculum,
        academicYear: input.academicYear,
        description: input.description,
        syllabusFileKey: input.syllabusFileKey,
        syllabusFileName: input.syllabusFileName,
        syllabusPagesJson: syllabusPages,
        materialFileKey: input.materialFileKey,
        materialFileName: input.materialFileName,
        materialPagesJson: input.materialPages ?? [],
        ...(units.length
          ? {
              units: {
                create: units.map((unit, order) => ({
                  name: unit.name,
                  order,
                  pageStart: unit.pageStart,
                  pageEnd: unit.pageEnd,
                  topics: { create: unit.topics.map((topic, topicOrder) => ({ ...topic, order: topicOrder })) },
                })),
              },
            }
          : {}),
      },
      include: { units: { include: { topics: true } } },
    });
  },

  async replaceUnits(subjectId: string, institutionId: string, units: SubjectUnitInput[]) {
    const subject = await db.subject.findFirst({ where: { id: subjectId, institutionId }, select: { id: true } });
    if (!subject) throw Object.assign(new Error("Subject not found"), { status: 404 });
    await db.$transaction(async (tx) => {
      await tx.subjectUnit.deleteMany({ where: { subjectId } });
      for (const [order, unit] of units.entries()) {
        await tx.subjectUnit.create({
          data: {
            subjectId,
            name: unit.name,
            order,
            pageStart: unit.pageStart,
            pageEnd: unit.pageEnd,
            topics: {
              create: unit.topics.map((topic, topicOrder) => ({ ...topic, order: topicOrder })),
            },
          },
        });
      }
    });
    return this.get(subjectId, institutionId);
  },
};

function detectUnits(pages: SubjectPage[]): SubjectUnitInput[] {
  const units: SubjectUnitInput[] = [];
  const heading = /^\s*(?:unit|module|chapter|part)\s+(?:\d+|[ivxlcdm]+)\s*[:.)\-–]?\s*(.*)$/i;
  const bullet = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/;

  for (const page of pages) {
    for (const rawLine of page.text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.length < 4 || line.length > 140) continue;
      const unitMatch = line.match(heading);
      if (unitMatch) {
        const title = unitMatch[1]?.trim() || line.trim();
        let unit = units.find((candidate) => candidate.name.toLocaleLowerCase() === title.toLocaleLowerCase());
        if (!unit) {
          unit = { name: title, pageStart: page.page, pageEnd: page.page, topics: [] };
          units.push(unit);
        }
        unit.pageEnd = page.page;
        continue;
      }
      const current = units.at(-1);
      const topic = line.match(bullet)?.[1]?.trim();
      if (current && topic && !current.topics.some((item) => item.name.toLocaleLowerCase() === topic.toLocaleLowerCase())) {
        current.pageEnd = page.page;
        current.topics.push({ name: topic, pageStart: page.page, pageEnd: page.page });
      }
    }
  }

  if (units.length) return units;
  return pages.map((page) => ({
    name: `Imported material · page ${page.page}`,
    pageStart: page.page,
    pageEnd: page.page,
    topics: [{ name: `Page ${page.page}`, pageStart: page.page, pageEnd: page.page }],
  }));
}
