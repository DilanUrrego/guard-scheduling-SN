import {
  Injectable, NotFoundException, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { UploadUrlDto } from './dto/upload-url.dto';

const URL_TTL_SECONDS = 300; // 5 minutos

/**
 * RF-02: genera URLs pre-firmadas para que el navegador suba el soporte
 * directo a S3 (el archivo no pasa por el backend).
 * Las credenciales vienen del rol de la EC2 (LabInstanceProfile), nunca del código.
 */
@Injectable()
export class SupportsService {
  private readonly s3 = new S3Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
  private readonly bucket = process.env.SUPPORTS_BUCKET;

  constructor(private prisma: PrismaService) {}

  async createUploadUrl(noveltyId: string, dto: UploadUrlDto) {
    const bucket = this.requireBucket();
    const novelty = await this.prisma.novelty.findUnique({
      where: { id: noveltyId },
      include: { novelty_type: true },
    });
    if (!novelty) throw new NotFoundException('Novedad no encontrada');
    if (!novelty.novelty_type.support_required)
      throw new BadRequestException('Este tipo de novedad no requiere soporte');

    // Ej.: supports/novelty-7c1e.../3f2a...-incapacidad.pdf
    const key = `supports/novelty-${noveltyId}/${randomUUID()}-${this.safeName(dto.fileName)}`;
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: dto.contentType }),
      { expiresIn: URL_TTL_SECONDS },
    );
    return { uploadUrl, key, expiresIn: URL_TTL_SECONDS };
  }

  async listDocuments(noveltyId: string) {
    const bucket = this.requireBucket();
    const exists = await this.prisma.novelty.findUnique({ where: { id: noveltyId } });
    if (!exists) throw new NotFoundException('Novedad no encontrada');

    const docs = await this.prisma.supportDocument.findMany({
      where: { novelty_id: noveltyId },
      orderBy: { created_at: 'desc' },
    });
    return Promise.all(docs.map(async (d) => ({
      ...d,
      downloadUrl: await getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: bucket, Key: d.s3_key }),
        { expiresIn: URL_TTL_SECONDS },
      ),
    })));
  }

  private requireBucket(): string {
    if (!this.bucket) throw new InternalServerErrorException('SUPPORTS_BUCKET no está configurado');
    return this.bucket;
  }

  /** Quita tildes y caracteres raros para que la clave de S3 sea segura. */
  private safeName(name: string): string {
    return name
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-100);
  }
}
