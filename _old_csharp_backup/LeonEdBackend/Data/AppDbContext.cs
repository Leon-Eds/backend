using Microsoft.EntityFrameworkCore;
using LeonEdBackend.Models;
using LeonEdBackend.Helpers;

namespace LeonEdBackend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<School> Schools => Set<School>();
        public DbSet<Student> Students => Set<Student>();
        public DbSet<Teacher> Teachers => Set<Teacher>();
        public DbSet<Class> Classes => Set<Class>();
        public DbSet<Subject> Subjects => Set<Subject>();
        public DbSet<AcademicSession> AcademicSessions => Set<AcademicSession>();
        public DbSet<Term> Terms => Set<Term>();
        public DbSet<TeacherSubjectAssignment> TeacherSubjectAssignments => Set<TeacherSubjectAssignment>();
        public DbSet<ClassSubject> ClassSubjects => Set<ClassSubject>();

        // Month 2: Academic Workflow & Result Processing
        public DbSet<GradingRule> GradingRules => Set<GradingRule>();
        public DbSet<Score> Scores => Set<Score>();
        public DbSet<Result> Results => Set<Result>();
        public DbSet<FeePayment> FeePayments => Set<FeePayment>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==================== User ====================
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasConversion<string>().HasMaxLength(30);
                entity.HasOne(e => e.School)
                      .WithMany(s => s.Users)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==================== School ====================
            modelBuilder.Entity<School>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Slug).IsUnique();
                entity.HasIndex(e => e.ContactEmail).IsUnique();
                entity.Property(e => e.SubscriptionPlan).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.SubscriptionStatus).HasConversion<string>().HasMaxLength(20);
                entity.Ignore(e => e.MaxTeachers);
                entity.Ignore(e => e.MaxStudents);
            });

            // ==================== Student ====================
            modelBuilder.Entity<Student>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.AdmissionNumber }).IsUnique();
                entity.HasIndex(e => e.SchoolId);
                entity.Property(e => e.Gender).HasConversion<string>().HasMaxLength(10);
                entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
                entity.HasOne(e => e.School)
                      .WithMany(s => s.Students)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.Class)
                      .WithMany(c => c.Students)
                      .HasForeignKey(e => e.ClassId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==================== Teacher ====================
            modelBuilder.Entity<Teacher>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.SchoolId);
                entity.HasOne(e => e.School)
                      .WithMany(s => s.Teachers)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.User)
                      .WithMany()
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== Class ====================
            modelBuilder.Entity<Class>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.SchoolId);
                entity.HasOne(e => e.School)
                      .WithMany(s => s.Classes)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.AcademicSession)
                      .WithMany(a => a.Classes)
                      .HasForeignKey(e => e.AcademicSessionId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==================== Subject ====================
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.Name }).IsUnique();
                entity.HasOne(e => e.School)
                      .WithMany(s => s.Subjects)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== AcademicSession ====================
            modelBuilder.Entity<AcademicSession>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.SchoolId);
                entity.HasOne(e => e.School)
                      .WithMany(s => s.AcademicSessions)
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== Term ====================
            modelBuilder.Entity<Term>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TermNumber).HasConversion<string>().HasMaxLength(10);
                entity.HasIndex(e => new { e.AcademicSessionId, e.TermNumber }).IsUnique();
                entity.HasOne(e => e.AcademicSession)
                      .WithMany(a => a.Terms)
                      .HasForeignKey(e => e.AcademicSessionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== TeacherSubjectAssignment ====================
            modelBuilder.Entity<TeacherSubjectAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TeacherId, e.SubjectId, e.ClassId }).IsUnique();
                entity.HasOne(e => e.Teacher)
                      .WithMany(t => t.SubjectAssignments)
                      .HasForeignKey(e => e.TeacherId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Subject)
                      .WithMany(s => s.TeacherAssignments)
                      .HasForeignKey(e => e.SubjectId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Class)
                      .WithMany(c => c.TeacherAssignments)
                      .HasForeignKey(e => e.ClassId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== ClassSubject ====================
            modelBuilder.Entity<ClassSubject>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.ClassId, e.SubjectId }).IsUnique();
                entity.HasOne(e => e.Class)
                      .WithMany(c => c.ClassSubjects)
                      .HasForeignKey(e => e.ClassId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Subject)
                      .WithMany(s => s.ClassSubjects)
                      .HasForeignKey(e => e.SubjectId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== GradingRule ====================
            modelBuilder.Entity<GradingRule>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.Grade }).IsUnique();
                entity.Property(e => e.Grade).HasConversion<string>().HasMaxLength(5);
                entity.HasOne(e => e.School)
                      .WithMany()
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // ==================== Score ====================
            modelBuilder.Entity<Score>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.StudentId, e.SubjectId, e.TermId }).IsUnique();
                entity.HasIndex(e => new { e.SchoolId, e.ClassId, e.SubjectId, e.TermId });
                entity.Property(e => e.Grade).HasConversion<string>().HasMaxLength(5);
                entity.Property(e => e.FirstCA).HasPrecision(5, 2);
                entity.Property(e => e.SecondCA).HasPrecision(5, 2);
                entity.Property(e => e.Exam).HasPrecision(5, 2);
                entity.Property(e => e.Total).HasPrecision(6, 2);
                entity.HasOne(e => e.School)
                      .WithMany()
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Student)
                      .WithMany()
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Subject)
                      .WithMany()
                      .HasForeignKey(e => e.SubjectId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Class)
                      .WithMany()
                      .HasForeignKey(e => e.ClassId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Term)
                      .WithMany()
                      .HasForeignKey(e => e.TermId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.AcademicSession)
                      .WithMany()
                      .HasForeignKey(e => e.AcademicSessionId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.EnteredByTeacher)
                      .WithMany()
                      .HasForeignKey(e => e.EnteredByTeacherId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // ==================== Result ====================
            modelBuilder.Entity<Result>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.StudentId, e.TermId }).IsUnique();
                entity.HasIndex(e => new { e.SchoolId, e.ClassId, e.TermId });
                entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.TotalScore).HasPrecision(8, 2);
                entity.Property(e => e.Average).HasPrecision(6, 2);
                entity.HasOne(e => e.School)
                      .WithMany()
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Student)
                      .WithMany()
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Class)
                      .WithMany()
                      .HasForeignKey(e => e.ClassId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.Term)
                      .WithMany()
                      .HasForeignKey(e => e.TermId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.AcademicSession)
                      .WithMany()
                      .HasForeignKey(e => e.AcademicSessionId)
                      .OnDelete(DeleteBehavior.NoAction);
            });

            // ==================== FeePayment ====================
            modelBuilder.Entity<FeePayment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.SchoolId, e.StudentId, e.TermId }).IsUnique();
                entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(20);
                entity.Property(e => e.AmountDue).HasPrecision(12, 2);
                entity.Property(e => e.AmountPaid).HasPrecision(12, 2);
                entity.HasOne(e => e.School)
                      .WithMany()
                      .HasForeignKey(e => e.SchoolId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Student)
                      .WithMany()
                      .HasForeignKey(e => e.StudentId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Term)
                      .WithMany()
                      .HasForeignKey(e => e.TermId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.AcademicSession)
                      .WithMany()
                      .HasForeignKey(e => e.AcademicSessionId)
                      .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(e => e.ClearedByUser)
                      .WithMany()
                      .HasForeignKey(e => e.ClearedByUserId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}