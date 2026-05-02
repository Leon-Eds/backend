using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LeonEdBackend.Models
{
    public class School
    {
        public Guid Id {get; set;}
        public Guid UserId {get; set;}
        public string Name {get; set;} = string.Empty;
        public string Address {get; set;} = string.Empty;
        public string ContactEmail {get; set;} = string.Empty;
        public string ContactPhone {get; set;} = string.Empty;
        public string LogoUrl {get; set;} = string.Empty;
        public SubscriptionStatus SubscriptionStatus {get; set;}
        public DateTime CreatedAt {get; set;}
    }

    public enum SubscriptionStatus
    {
        Free,
        Trial,
        Paid,
        Expired
    }
}