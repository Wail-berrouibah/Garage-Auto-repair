import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, branchId: string, userId: string) {
    const doc = await this.prisma.document.create({
      data: {
        branchId,
        uploadedBy: userId,
        fileName: dto.fileName,
        originalName: dto.fileName,
        category: dto.category || null,
        entityType: dto.entityType || null,
        entityId: dto.entityId || null,
        mimeType: 'application/octet-stream',
        fileSize: 0,
        s3Key: '',
      },
    });

    this.logger.log(`Document created: ${doc.id} (${doc.fileName})`);
    return doc;
  }

  async findAll(branchId: string, search?: string) {
    return this.prisma.document.findMany({
      where: {
        branchId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { fileName: { contains: search, mode: 'insensitive' } },
                { originalName: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async findById(id: string, branchId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, branchId, deletedAt: null },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto, branchId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, branchId, deletedAt: null },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const updated = await this.prisma.document.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Document updated: ${updated.id}`);
    return updated;
  }

  async softDelete(id: string, branchId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, branchId, deletedAt: null },
    });

    if (!doc) throw new NotFoundException('Document not found');

    const deleted = await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Document soft-deleted: ${deleted.id}`);
    return deleted;
  }
}
