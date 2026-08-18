import { Inject, Injectable, Logger } from '@nestjs/common';
import { Models } from '@app/common';
import { IProductDoc } from '@/types/product';

@Injectable()
export class StuffidRepository {
  private readonly logger = new Logger(StuffidRepository.name);
  private readonly BULK_OPERATIONS_SIZE = 5000; // MongoDB bulk operations limit

  constructor(@Inject('ModelService') private readonly models: Models) {}

  private get productModel() {
    return this.models.product.model;
  }

  /**
   * Insert products as new documents using insertMany
   * No updates, no upserts - purely new inserts
   */
  async saveProducts(
    products: Partial<IProductDoc>[],
  ): Promise<{ inserted: number; failed: number; total: number }> {
    let totalInserted = 0;
    let totalFailed = 0;
    const total = products.length;

    // this.logger.log(
    //   `Starting to insert ${total} products in batches of ${this.BULK_OPERATIONS_SIZE}`,
    // );

    // Process in batches to avoid memory issues
    for (let i = 0; i < products.length; i += this.BULK_OPERATIONS_SIZE) {
      await new Promise(resolve => setTimeout(resolve, 50));

      const batch = products.slice(i, i + this.BULK_OPERATIONS_SIZE);
      try {
        // Use insertMany with ordered: false to continue on errors
        const result = await this.productModel.insertMany(batch, {
          ordered: false, // Continue inserting even if some documents fail
          rawResult: true, // Get detailed results
        });

        totalInserted += result.insertedCount || batch.length;

        // Log progress every 50,000 records
        const processed = Math.min(i + this.BULK_OPERATIONS_SIZE, total);
        if (processed % 50000 === 0 || processed === total) {
          this.logger.log(`Progress: ${processed}/${total} records inserted`);
        }
      } catch (error) {
        // If ordered: false, some documents might have been inserted
        // despite the error
        if (error.writeErrors) {
          const insertedCount = batch.length - error.writeErrors.length;
          totalInserted += insertedCount;
          totalFailed += error.writeErrors.length;

          this.logger.warn(
            `Batch partial success: ${insertedCount} inserted, ${error.writeErrors.length} failed`,
          );
        } else if (error.insertedDocs) {
          // Some drivers return insertedDocs even on error
          totalInserted += error.insertedDocs.length;
          totalFailed += batch.length - error.insertedDocs.length;
        } else {
          // Complete failure - try inserting one by one
          this.logger.error(`Batch insert failed completely: ${error.message}`);
          this.logger.log(
            `Falling back to individual inserts for this batch...`,
          );

          const { inserted, failed } = await this.saveBatchIndividually(batch);
          totalInserted += inserted;
          totalFailed += failed;
        }
      }
    }

    this.logger.log(
      `Insert complete: ${totalInserted} inserted, ${totalFailed} failed out of ${total} total`,
    );

    return {
      inserted: totalInserted,
      failed: totalFailed,
      total,
    };
  }

  /**
   * Fallback method for individual record insertion
   */
  private async saveBatchIndividually(
    products: Partial<IProductDoc>[],
  ): Promise<{ inserted: number; failed: number }> {
    let inserted = 0;
    let failed = 0;

    for (const product of products) {
      try {
        // Create a new document instance
        const newProduct = new this.productModel(product);
        await newProduct.save();
        inserted++;
      } catch (error) {
        // Log the error but continue with other records
        if (error.code === 11000) {
          // Duplicate key error - still insert with modified ID
          try {
            const modifiedProduct = {
              ...product,
              ID: `${product.ID}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            };
            const newProduct = new this.productModel(modifiedProduct);
            await newProduct.save();
            inserted++;
          } catch (retryError) {
            this.logger.error(
              `Failed to insert product ${product.ID}: ${retryError.message}`,
            );
            failed++;
          }
        } else {
          this.logger.error(
            `Failed to insert product ${product.ID}: ${error.message}`,
          );
          failed++;
        }
      }
    }

    return { inserted, failed };
  }

  /**
   * Clean all records from a specific batch
   */
  async cleanupBatch(batchId: string): Promise<number> {
    const result = await this.productModel.deleteMany({
      importBatch: batchId,
    });
    this.logger.log(
      `Cleaned up ${result.deletedCount} records from batch ${batchId}`,
    );
    return result.deletedCount;
  }

  /**
   * Clean all records from the collection
   */
  async cleanupAll(): Promise<number> {
    const result = await this.productModel.deleteMany({});
    this.logger.log(`Cleaned up all ${result.deletedCount} records`);
    return result.deletedCount;
  }

  async deleteOldBatchChunk(
    activeBatchId: string,
    limit: number
  ): Promise<number> {
    const documentsToDelete = await this.productModel
      .find({
        importBatch: { $ne: activeBatchId },
      })
      .limit(limit)
      .select('_id')
      .lean()
      .exec();

    if (documentsToDelete.length === 0) {
      return 0;
    }

    const ids = documentsToDelete.map(doc => doc._id);

    const bulkOps = ids.map(id => ({
      deleteOne: { filter: { _id: id } }
    }));

    const result = await this.productModel.bulkWrite(bulkOps, {
      ordered: false,
    });

    return result.deletedCount || 0;
  }
  /**
   * Get total count of documents
   */
  async getTotalCount(): Promise<number> {
    return this.productModel.countDocuments();
  }

  async deactivateOldBatch(batchId: string): Promise<{
    activated: number;
    deleted: number;
  }> {

    try {
      let activated = 0;
      let deleted = 0;

      //Mark all products in this batch as active
      // const updateResult = await this.productModel.updateMany(
      //   { importBatch: batchId },
      //   {
      //     $set: {
      //       isActive: true,
      //       activatedAt: new Date(),
      //     },
      //   },
      // );

      // this.logger.log(
      //   `Marked ${updateResult.modifiedCount} records as active in batch ${batchId}`,
      // );

      // Deactivate all records from other batches
      // const deactivateResult = await this.productModel.updateMany(
      //   { importBatch: { $ne: batchId }, isActive: true },
      //   {
      //     $set: {
      //       isActive: false,
      //       deactivatedAt: new Date(),
      //     },
      //   },
      // );
      //
      // this.logger.log(
      //   `Deactivated ${deactivateResult.modifiedCount} records from old batches`,

      //Delete all inactive records (optional - keeps database clean)
      const deleteResult = await this.productModel.deleteMany({
        importBatch: { $ne: batchId },
      });
      deleted = deleteResult.deletedCount;
      this.logger.log(`Deleted ${deleted} old inactive records`);

      // Step 4: Count active records
      // activated = await this.productModel.countDocuments({
      //   importBatch: batchId,
      //   isActive: true,
      // }).session(session);
      //
      // this.logger.log(`Batch ${batchId} activated with ${activated} active records`);
      //});

      return { activated, deleted };
    } catch (error) {
      this.logger.error(
        `Failed to activate batch ${batchId}: ${error.message}`,
      );
      throw error;
    } finally {
      // await session.endSession();
    }
  }

  /**
   * Rollback a failed batch
   */
  async rollbackBatch(batchId: string): Promise<number> {
    this.logger.log(`Rolling back failed batch: ${batchId}`);

    const result = await this.productModel.deleteMany({
      importBatch: batchId,
      isActive: false, // Only delete if not yet activated
    });

    this.logger.log(
      `Rolled back ${result.deletedCount} records from batch ${batchId}`,
    );
    return result.deletedCount;
  }

  /**
   * Clean up failed batches (keep current active batch)
   */
  async cleanupFailedBatches(currentBatchId: string): Promise<number> {
    const result = await this.productModel.deleteMany({
      importBatch: { $ne: currentBatchId },
      isActive: false,
    });

    this.logger.log(
      `Cleaned up ${result.deletedCount} records from failed batches`,
    );
    return result.deletedCount;
  }

  /**
   * Get current active batch ID
   */
  async getCurrentActiveBatchId(): Promise<string | null> {
    const result = await this.productModel
      .findOne({ isActive: true }, { importBatch: 1 })
      .sort({ activatedAt: -1 })
      .limit(1);

    return result?.importBatch || null;
  }

  /**
   * Get only active products (for API queries)
   */
  async getActiveProducts(query: any = {}): Promise<IProductDoc[]> {
    return this.productModel
      .find({
        ...query,
        isActive: true,
      })
      .lean();
  }

  /**
   * Get statistics about imported products
   */
  async getImportStats(): Promise<{
    totalRecords: number;
    activeRecords: number;
    inactiveRecords: number;
    activeBatch: string | null;
    lastImportDate: Date | null;
    batches: Array<{
      batchId: string;
      count: number;
      isActive: boolean;
      importedAt: Date;
    }>;
  }> {
    const stats = await this.productModel.aggregate([
      {
        $group: {
          _id: '$importBatch',
          count: { $sum: 1 },
          isActive: { $max: '$isActive' },
          importedAt: { $max: '$importDate' },
        },
      },
      {
        $sort: { importedAt: -1 },
      },
    ]);

    const activeBatch = stats.find((s: any) => s.isActive);
    const totalActive = await this.productModel.countDocuments({
      isActive: true,
    });
    const totalInactive = await this.productModel.countDocuments({
      isActive: false,
    });

    return {
      totalRecords: totalActive + totalInactive,
      activeRecords: totalActive,
      inactiveRecords: totalInactive,
      activeBatch: activeBatch?._id || null,
      lastImportDate: stats.length > 0 ? stats[0].importedAt : null,
      batches: stats.map((s: any) => ({
        batchId: s._id,
        count: s.count,
        isActive: s.isActive,
        importedAt: s.importedAt,
      })),
    };
  }
}
