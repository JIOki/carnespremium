const { getPrismaClient } = require('../database/connection');
const gamificationService = require('./gamificationService');
const crypto = require('crypto');

/**
 * =====================================================
 * REFERRAL SERVICE
 * =====================================================
 * Sistema completo de referidos:
 * - Generación de códigos únicos
 * - Tracking de referidos
 * - Recompensas escalonadas
 * - Estadísticas
 */

class ReferralService {
  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Generar código de referido único para un usuario
   */
  generateReferralCode(userId) {
    const hash = crypto.createHash('sha256').update(userId + Date.now()).digest('hex');
    return hash.substring(0, 8).toUpperCase();
  }

  /**
   * Obtener o crear código de referido del usuario
   */
  async getOrCreateReferralCode(userId) {
    const loyalty = await gamificationService.getOrCreateLoyalty(userId);
    
    // Buscar si ya tiene código
    let referral = await this.prisma.referral.findFirst({
      where: { referrerId: userId }
    });

    if (!referral) {
      const code = this.generateReferralCode(userId);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://carnespremium.com';
      
      referral = await this.prisma.referral.create({
        data: {
          referrerId: userId,
          referrerLoyaltyId: loyalty.id,
          referredEmail: 'PLACEHOLDER',
          referralCode: code,
          referralLink: `${baseUrl}/register?ref=${code}`,
          status: 'PENDING'
        }
      });
    }

    return {
      code: referral.referralCode,
      link: referral.referralLink
    };
  }

  /**
   * Obtener estadísticas de referidos de un usuario
   */
  async getUserReferralStats(userId) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: referrals.length,
      registered: referrals.filter(r => r.status !== 'PENDING').length,
      converted: referrals.filter(r => r.status === 'COMPLETED').length,
      pending: referrals.filter(r => r.status === 'PENDING').length,
      totalPointsEarned: referrals.reduce((sum, r) => sum + r.referrerPoints, 0),
      conversionRate: 0
    };

    if (stats.registered > 0) {
      stats.conversionRate = (stats.converted / stats.registered) * 100;
    }

    return {
      stats,
      referrals: referrals.map(r => ({
        email: r.referredEmail,
        status: r.status,
        pointsEarned: r.referrerPoints,
        registeredAt: r.registeredAt,
        firstPurchaseAt: r.firstPurchaseAt,
        firstPurchaseAmount: r.firstPurchaseAmount
      }))
    };
  }

  /**
   * Registrar clic en link de referido
   */
  async trackReferralClick(referralCode) {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode }
    });

    if (!referral) {
      return null;
    }

    await this.prisma.referral.update({
      where: { referralCode },
      data: {
        clickCount: { increment: 1 },
        lastClickAt: new Date()
      }
    });

    return referral;
  }

  /**
   * Procesar registro de usuario referido
   */
  async processReferralSignup(referralCode, referredUserId, referredEmail) {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode }
    });

    if (!referral) {
      throw new Error('Código de referido inválido');
    }

    // Crear o actualizar el registro de referido
    const updated = await this.prisma.referral.update({
      where: { referralCode },
      data: {
        referredUserId,
        referredEmail,
        status: 'REGISTERED',
        registeredAt: new Date()
      }
    });

    // Otorgar puntos al referrer por el registro
    const SIGNUP_POINTS = 200;
    await gamificationService.addPoints({
      userId: referral.referrerId,
      points: SIGNUP_POINTS,
      action: 'REFERRAL',
      type: 'EARNED',
      referenceType: 'REFERRAL',
      referenceId: updated.id,
      description: `Amigo referido se registró: ${referredEmail}`
    });

    await this.prisma.referral.update({
      where: { id: updated.id },
      data: {
        referrerPoints: SIGNUP_POINTS,
        referrerBonusPaid: true
      }
    });

    // Otorgar puntos de bienvenida al referido
    const WELCOME_POINTS = 200;
    await gamificationService.addPoints({
      userId: referredUserId,
      points: WELCOME_POINTS,
      action: 'REFERRAL',
      type: 'EARNED',
      referenceType: 'REFERRAL',
      referenceId: updated.id,
      description: `Bienvenida - Referido por un amigo`
    });

    await this.prisma.referral.update({
      where: { id: updated.id },
      data: {
        referredPoints: WELCOME_POINTS,
        referredBonusPaid: true
      }
    });

    // Actualizar contador de referidos del referrer
    const loyalty = await gamificationService.getOrCreateLoyalty(referral.referrerId);
    await this.prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        totalReferrals: { increment: 1 }
      }
    });

    return {
      success: true,
      referrerPoints: SIGNUP_POINTS,
      referredPoints: WELCOME_POINTS
    };
  }

  /**
   * Procesar primera compra de usuario referido
   */
  async processReferralFirstPurchase(referredUserId, orderTotal) {
    const referral = await this.prisma.referral.findFirst({
      where: {
        referredUserId,
        status: 'REGISTERED'
      }
    });

    if (!referral) {
      return null; // No es un referido o ya procesado
    }

    // Actualizar estado del referral
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'FIRST_PURCHASE',
        firstPurchaseAt: new Date(),
        firstPurchaseAmount: orderTotal
      }
    });

    // Otorgar puntos bonus al referrer
    const FIRST_PURCHASE_BONUS = 500;
    await gamificationService.addPoints({
      userId: referral.referrerId,
      points: FIRST_PURCHASE_BONUS,
      action: 'REFERRAL',
      type: 'EARNED',
      referenceType: 'REFERRAL',
      referenceId: referral.id,
      description: `Amigo referido hizo su primera compra ($${orderTotal.toFixed(2)})`
    });

    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        referrerPoints: { increment: FIRST_PURCHASE_BONUS }
      }
    });

    // Si la compra es mayor a $100, bonus extra
    if (orderTotal >= 100) {
      const EXTRA_BONUS = 250;
      await gamificationService.addPoints({
        userId: referral.referrerId,
        points: EXTRA_BONUS,
        action: 'BONUS',
        type: 'EARNED',
        referenceType: 'REFERRAL',
        referenceId: referral.id,
        description: `Bonus - Primera compra del referido mayor a $100`
      });

      await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          referrerPoints: { increment: EXTRA_BONUS }
        }
      });
    } else {
      await this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED'
        }
      });
    }

    // Verificar badges de referidos
    const badgeService = require('./badgeService');
    await badgeService.checkReferralBadges(referral.referrerId);

    return {
      success: true,
      bonusPoints: orderTotal >= 100 ? FIRST_PURCHASE_BONUS + 250 : FIRST_PURCHASE_BONUS
    };
  }

  /**
   * Obtener top referrers (admin/leaderboard)
   */
  async getTopReferrers(limit = 10) {
    const referrals = await this.prisma.referral.groupBy({
      by: ['referrerId'],
      _count: {
        id: true
      },
      _sum: {
        referrerPoints: true
      },
      where: {
        status: { in: ['REGISTERED', 'FIRST_PURCHASE', 'COMPLETED'] }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    });

    const results = [];
    for (const ref of referrals) {
      const user = await this.prisma.user.findUnique({
        where: { id: ref.referrerId },
        select: { id: true, name: true, email: true }
      });

      results.push({
        user,
        totalReferrals: ref._count.id,
        totalPointsEarned: ref._sum.referrerPoints || 0
      });
    }

    return results;
  }

  /**
   * Generar QR code para referidos (retorna data URL)
   */
  async generateReferralQR(userId) {
    const { link } = await this.getOrCreateReferralCode(userId);
    
    // En producción, usarías una librería como 'qrcode'
    // Por ahora retornamos la información necesaria
    return {
      link,
      qrData: link,
      message: 'Genera el QR con la librería qrcode en el frontend'
    };
  }
}

module.exports = new ReferralService();
