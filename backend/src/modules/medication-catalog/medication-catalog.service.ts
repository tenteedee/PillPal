import { ERROR_CODE } from '../../shared/constants/error/error-codes.js';
import { ERROR_MESSAGE } from '../../shared/constants/error/error-messages.js';
import { HTTP_STATUS } from '../../shared/constants/http/http-status.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { mapMedicationCatalogRowToDto } from './medication-catalog.mapper.js';
import { MedicationCatalogRepository } from './medication-catalog.repository.js';
import type {
  CreateMedicationCatalogBody,
  MedicationCatalogGetListInput,
  MedicationCatalogSearchInput,
  UpdateMedicationCatalogBody,
} from './medication-catalog.schema.js';
import type { MedicationCatalogDto } from './medication-catalog.types.js';

export class MedicationCatalogService {
  constructor(private readonly repository: MedicationCatalogRepository) {}

  async list(
    input: MedicationCatalogGetListInput,
  ): Promise<MedicationCatalogDto[]> {
    const rows = await this.repository.list(input);
    return rows.map(mapMedicationCatalogRowToDto);
  }

  async search(
    input: MedicationCatalogSearchInput,
  ): Promise<MedicationCatalogDto[]> {
    if (input.name.length === 0) {
      throw new HttpError(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODE.VALIDATION_ERROR,
        ERROR_MESSAGE.INVALID_REQUEST_BODY,
      );
    }

    const rows = await this.repository.list(input);
    return rows.map(mapMedicationCatalogRowToDto);
  }

  async create(
    payload: CreateMedicationCatalogBody,
  ): Promise<MedicationCatalogDto> {
    const row = await this.repository.create(payload);
    return mapMedicationCatalogRowToDto(row);
  }

  async getById(id: string): Promise<MedicationCatalogDto> {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_CATALOG_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_CATALOG_NOT_FOUND,
      );
    }

    return mapMedicationCatalogRowToDto(row);
  }

  async updateById(
    id: string,
    payload: UpdateMedicationCatalogBody,
  ): Promise<MedicationCatalogDto> {
    const row = await this.repository.updateById(id, payload);
    if (!row) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_CATALOG_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_CATALOG_NOT_FOUND,
      );
    }

    return mapMedicationCatalogRowToDto(row);
  }

  async deleteById(id: string): Promise<void> {
    const deleted = await this.repository.deleteById(id);
    if (!deleted) {
      throw new HttpError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_CODE.MEDICATION_CATALOG_NOT_FOUND,
        ERROR_MESSAGE.MEDICATION_CATALOG_NOT_FOUND,
      );
    }
  }
}
