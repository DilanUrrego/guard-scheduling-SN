-- RF-02 / RF-03: documentos de soporte de las novedades (el archivo vive en S3)
CREATE TABLE "support_documents" (
    "id" TEXT NOT NULL,
    "novelty_id" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_documents_pkey" PRIMARY KEY ("id")
);

-- Una misma clave de S3 solo se registra una vez (la Lambda es idempotente)
CREATE UNIQUE INDEX "support_documents_s3_key_key" ON "support_documents"("s3_key");

CREATE INDEX "support_documents_novelty_id_idx" ON "support_documents"("novelty_id");

ALTER TABLE "support_documents" ADD CONSTRAINT "support_documents_novelty_id_fkey" FOREIGN KEY ("novelty_id") REFERENCES "novelties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
