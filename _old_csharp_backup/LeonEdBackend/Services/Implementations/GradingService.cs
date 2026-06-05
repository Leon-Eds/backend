using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Data;
using LeonEdBackend.DTOs.Common;
using LeonEdBackend.DTOs.GradingDtos;
using LeonEdBackend.Helpers;
using LeonEdBackend.Models;
using LeonEdBackend.Services.Interfaces;

namespace LeonEdBackend.Services.Implementations
{
    public class GradingService : IGradingService
    {
        private readonly AppDbContext _context;

        // Default grading rules if school hasn't configured custom ones
        private static readonly List<(Grade Grade, int Min, int Max, string Remark)> DefaultRules = new()
        {
            (Grade.A, 70, 100, "Excellent"),
            (Grade.B, 60, 69, "Very Good"),
            (Grade.C, 50, 59, "Good"),
            (Grade.D, 45, 49, "Fair"),
            (Grade.E, 40, 44, "Pass"),
            (Grade.F, 0, 39, "Fail")
        };

        public GradingService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ApiResponse<List<GradingRuleResponse>>> SetGradingRules(Guid schoolId, BulkCreateGradingRulesRequest request)
        {
            // Validate school exists
            var school = await _context.Schools.FindAsync(schoolId);
            if (school == null)
                return ApiResponse<List<GradingRuleResponse>>.FailResponse("School not found.");

            // Remove existing rules for this school
            var existingRules = await _context.GradingRules
                .Where(g => g.SchoolId == schoolId)
                .ToListAsync();
            _context.GradingRules.RemoveRange(existingRules);

            // Create new rules
            var newRules = request.Rules.Select(r => new GradingRule
            {
                Id = Guid.NewGuid(),
                SchoolId = schoolId,
                Grade = r.Grade,
                MinScore = r.MinScore,
                MaxScore = r.MaxScore,
                Remark = r.Remark
            }).ToList();

            _context.GradingRules.AddRange(newRules);
            await _context.SaveChangesAsync();

            var response = newRules.Select(r => new GradingRuleResponse
            {
                Id = r.Id,
                Grade = r.Grade.ToString(),
                MinScore = r.MinScore,
                MaxScore = r.MaxScore,
                Remark = r.Remark
            }).ToList();

            return ApiResponse<List<GradingRuleResponse>>.SuccessResponse(response, "Grading rules updated successfully.");
        }

        public async Task<ApiResponse<List<GradingRuleResponse>>> GetGradingRules(Guid schoolId)
        {
            var rules = await _context.GradingRules
                .Where(g => g.SchoolId == schoolId)
                .OrderByDescending(g => g.MaxScore)
                .ToListAsync();

            // Return defaults if no custom rules
            if (!rules.Any())
            {
                var defaults = DefaultRules.Select(r => new GradingRuleResponse
                {
                    Id = Guid.Empty,
                    Grade = r.Grade.ToString(),
                    MinScore = r.Min,
                    MaxScore = r.Max,
                    Remark = r.Remark
                }).ToList();

                return ApiResponse<List<GradingRuleResponse>>.SuccessResponse(defaults, "Default grading rules (no custom rules configured).");
            }

            var response = rules.Select(r => new GradingRuleResponse
            {
                Id = r.Id,
                Grade = r.Grade.ToString(),
                MinScore = r.MinScore,
                MaxScore = r.MaxScore,
                Remark = r.Remark
            }).ToList();

            return ApiResponse<List<GradingRuleResponse>>.SuccessResponse(response, "Grading rules retrieved.");
        }

        public async Task<Grade> GetGrade(Guid schoolId, decimal score)
        {
            var rules = await _context.GradingRules
                .Where(g => g.SchoolId == schoolId)
                .ToListAsync();

            int intScore = (int)Math.Round(score);

            if (rules.Any())
            {
                var match = rules.FirstOrDefault(r => intScore >= r.MinScore && intScore <= r.MaxScore);
                return match?.Grade ?? Grade.F;
            }

            // Use defaults
            var defaultMatch = DefaultRules.FirstOrDefault(r => intScore >= r.Min && intScore <= r.Max);
            return defaultMatch.Grade;
        }

        public async Task<string> GetRemark(Guid schoolId, decimal score)
        {
            var rules = await _context.GradingRules
                .Where(g => g.SchoolId == schoolId)
                .ToListAsync();

            int intScore = (int)Math.Round(score);

            if (rules.Any())
            {
                var match = rules.FirstOrDefault(r => intScore >= r.MinScore && intScore <= r.MaxScore);
                return match?.Remark ?? "Fail";
            }

            var defaultMatch = DefaultRules.FirstOrDefault(r => intScore >= r.Min && intScore <= r.Max);
            return defaultMatch.Remark;
        }
    }
}
