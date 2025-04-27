import { prisma } from '@/libs/prisma';

export class CategoryService {
  static getAll() {
    return prisma.category.findMany({ orderBy: { id: 'asc' } });
  }

  static async create(name: string, slug: string) {
    return prisma.category.create({ data: { name, slug } });
  }

  static async delete(id: number) {
    return prisma.category.delete({ where: { id } });
  }
}
