using System.ComponentModel.DataAnnotations;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Models
{
    public class School
    {
        public Guid Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Address { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string ContactEmail { get; set; } = string.Empty;

        [MaxLength(30)]
        public string ContactPhone { get; set; } = string.Empty;

        [MaxLength(500)]
        public string LogoUrl { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Slug { get; set; } = string.Empty;

        public SubscriptionPlan SubscriptionPlan { get; set; } = SubscriptionPlan.Free;

        public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.Active;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Student> Students { get; set; } = new List<Student>();
        public ICollection<Teacher> Teachers { get; set; } = new List<Teacher>();
        public ICollection<Class> Classes { get; set; } = new List<Class>();
        public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
        public ICollection<AcademicSession> AcademicSessions { get; set; } = new List<AcademicSession>();

        // Computed limits based on subscription plan
        public int MaxTeachers => SubscriptionPlan switch
        {
            SubscriptionPlan.Free => 20,
            SubscriptionPlan.Plus => 30,
            SubscriptionPlan.Premium => int.MaxValue,
            _ => 20
        };

        public int MaxStudents => SubscriptionPlan switch
        {
            SubscriptionPlan.Free => 100,
            SubscriptionPlan.Plus => 200,
            SubscriptionPlan.Premium => int.MaxValue,
            _ => 100
        };
    }
}