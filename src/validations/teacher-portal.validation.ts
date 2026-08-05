import { z } from "zod";

const domainRatingSchema = z.number().int().min(1).max(5);

export const updateTeacherSignatureSchema = z.object({
  signatureUrl: z.string().max(500, "Signature URL must be 500 characters or less"),
});

export const updateStudentDomainsSchema = z.object({
  termId: z.string().uuid("Invalid term ID format"),
  affectiveDomains: z.object({
    punctuality: domainRatingSchema.optional().default(5),
    neatness: domainRatingSchema.optional().default(5),
    politeness: domainRatingSchema.optional().default(5),
    honesty: domainRatingSchema.optional().default(5),
    cooperation: domainRatingSchema.optional().default(5),
    peerRelationship: domainRatingSchema.optional().default(5),
  }).optional(),
  psychomotorDomains: z.object({
    handwriting: domainRatingSchema.optional().default(5),
    publicSpeaking: domainRatingSchema.optional().default(5),
    sports: domainRatingSchema.optional().default(5),
    clubParticipation: domainRatingSchema.optional().default(5),
    craftSkills: domainRatingSchema.optional().default(5),
    musicalSkill: domainRatingSchema.optional().default(5),
  }).optional(),
  teacherComment: z.string().max(500).optional(),
  formTeacherRemark: z.string().max(500).optional(),
  daysPresent: z.number().int().nonnegative().optional(),
  daysSchoolOpened: z.number().int().nonnegative().optional(),
  promotedTo: z.string().max(100).optional(),
});
