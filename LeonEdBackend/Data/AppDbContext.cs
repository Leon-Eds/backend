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
        }
    }
}