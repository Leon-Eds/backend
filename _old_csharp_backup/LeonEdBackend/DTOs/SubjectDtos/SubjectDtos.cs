using System.ComponentModel.DataAnnotations;

namespace LeonEdBackend.DTOs.SubjectDtos
{
    public class CreateSubjectRequest
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;
    }

    public class UpdateSubjectRequest
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;
    }

    public class SubjectResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ClassCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
