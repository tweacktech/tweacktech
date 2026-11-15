import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

const DEFAULT_RATES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateFromUsd: 1 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rateFromUsd: 1600 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rateFromUsd: 15.5 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateFromUsd: 0.79 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateFromUsd: 0.92 },
];

@Injectable()
export class CurrenciesService {
  private readonly logger = new Logger(CurrenciesService.name);
  private cache: { at: number; rates: any[] } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    const rates = await this.loadRates();
    return rates.filter((rate) => includeInactive || rate.isActive !== false);
  }

  async convert(amount: number, from: string, to: string) {
    const fromCode = (from || 'USD').toUpperCase();
    const toCode = (to || 'USD').toUpperCase();
    const rates = await this.loadRates();

    const fromRate = rates.find((rate) => rate.code === fromCode);
    const toRate = rates.find((rate) => rate.code === toCode);

    if (!fromRate) throw new BadRequestException(`Unsupported currency: ${fromCode}`);
    if (!toRate) throw new BadRequestException(`Unsupported currency: ${toCode}`);

    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    const usd = numeric / Number(fromRate.rateFromUsd);
    const converted = usd * Number(toRate.rateFromUsd);

    return {
      amount: numeric,
      from: fromCode,
      to: toCode,
      rate: Number((Number(toRate.rateFromUsd) / Number(fromRate.rateFromUsd)).toFixed(6)),
      converted: Number(converted.toFixed(2)),
      symbol: toRate.symbol,
      updatedAt: toRate.updatedAt || new Date().toISOString(),
    };
  }

  async getMap() {
    const rates = await this.loadRates();
    return rates.reduce<Record<string, number>>((acc, rate) => {
      acc[rate.code] = Number(rate.rateFromUsd);
      return acc;
    }, {});
  }

  async upsert(
    code: string,
    data: { name?: string; symbol?: string; rateFromUsd?: number; isActive?: boolean },
  ) {
    const normalized = code.toUpperCase();
    const rate = Number(data.rateFromUsd);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new BadRequestException('rateFromUsd must be greater than zero');
    }
    this.cache = null;
    return this.prisma.currencyRate.upsert({
      where: { code: normalized },
      update: {
        name: data.name,
        symbol: data.symbol,
        rateFromUsd: rate,
        isActive: data.isActive,
      },
      create: {
        code: normalized,
        name: data.name || normalized,
        symbol: data.symbol || normalized,
        rateFromUsd: rate,
        isActive: data.isActive ?? true,
      },
    });
  }

  private async loadRates() {
    if (this.cache && Date.now() - this.cache.at < 60_000) {
      return this.cache.rates;
    }

    try {
      const rows = await this.prisma.currencyRate.findMany({
        orderBy: { code: 'asc' },
      });
      if (rows.length > 0) {
        this.cache = { at: Date.now(), rates: rows };
        return rows;
      }
    } catch (error) {
      this.logger.warn(
        `Currency rates unavailable, using defaults: ${
          error instanceof Error ? error.message.split('\n')[0] : error
        }`,
      );
    }

    return DEFAULT_RATES.map((rate) => ({ ...rate, isActive: true }));
  }
}
