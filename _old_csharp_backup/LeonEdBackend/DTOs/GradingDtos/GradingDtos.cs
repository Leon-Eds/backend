using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.DTOs.GradingDtos
{
    public class CreateGradingRuleRequest
    {
        public Grade Grade { get; set; }

        [Range(0, 100)]
        public int MinScore { get; set; }

        [Range(0, 100)]
        public int MaxScore { get; set; }

        [MaxLength(100)]
        public string Remark { get; set; } = string.Empty;
    }

    public class BulkCreateGradingRulesRequest
    {
        [Required]
        public List<CreateGradingRuleRequest> Rules { get; set; } = new();
    }

    public class GradingRuleResponse
    {
        public Guid Id { get; set; }
        public string Grade { get; set; } = string.Empty;
        public int MinScore { get; set; }
        public int MaxScore { get; set; }
        public string Remark { get; set; } = string.Empty;
    }
}
