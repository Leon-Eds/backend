using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.DTOs.SessionDtos
{
    public class CreateSessionRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty; // e.g. "2025/2026"

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class CreateTermRequest
    {
        [Required]
        public TermNumber TermNumber { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }
    }

    public class SessionResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsCurrent { get; set; }
        public List<TermResponse> Terms { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class TermResponse
    {
        public Guid Id { get; set; }
        public string TermNumber { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsCurrent { get; set; }
    }
}
