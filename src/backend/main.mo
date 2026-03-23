import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

actor {
  type Task = {
    name : Text;
    baseAmount : Nat;
    completed : Bool;
  };

  type Quest = {
    tasks : [Task];
    date : Text;
    completed : Bool;
  };

  type Profile = {
    weight : Nat;
    xp : Nat;
    level : Nat;
    streak : Nat;
    lastQuestDate : ?Text;
    quest : ?Quest;
  };

  module Profile {
    public func compare(profile1 : Profile, profile2 : Profile) : Order.Order {
      Nat.compare(profile1.xp, profile2.xp);
    };
    public func compareByLevel(profile1 : Profile, profile2 : Profile) : Order.Order {
      Nat.compare(profile1.level, profile2.level);
    };
  };

  let profiles = Map.empty<Principal, Profile>();

  public shared ({ caller }) func initializeProfile(weight : Nat) : async () {
    let profile : Profile = {
      weight;
      xp = 0;
      level = 1;
      streak = 0;
      lastQuestDate = null;
      quest = null;
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func getQuest() : async Quest {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let currentDate = getCurrentDate();
        switch (profile.lastQuestDate) {
          case (?date) {
            if (date == currentDate) {
              switch (profile.quest) {
                case (null) { createQuest(caller, currentDate) };
                case (?quest) { quest };
              };
            } else { createQuest(caller, currentDate) };
          };
          case (null) { createQuest(caller, currentDate) };
        };
      };
    };
  };

  public shared ({ caller }) func completeTask(taskName : Text) : async () {
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("Profile not found") };
      case (?profile) {
        let currentDate = getCurrentDate();
        switch (profile.lastQuestDate) {
          case (?date) {
            if (date != currentDate) { Runtime.trap("No active quest for today") };
          };
          case (null) { Runtime.trap("No active quest for today") };
        };

        switch (profile.quest) {
          case (null) { Runtime.trap("Quest not found") };
          case (?quest) {
            let updatedTasks = quest.tasks.map(
              func(task) {
                if (task.name == taskName) {
                  { task with completed = true };
                } else { task };
              }
            );
            let updatedQuest = {
              quest with tasks = updatedTasks;
              completed = updatedTasks.filter(func(t) { not t.completed }).isEmpty();
            };
            let updatedProfile = { profile with quest = ?updatedQuest };
            profiles.add(caller, updatedProfile);
          };
        };
      };
    };
  };

  func getCurrentDate() : Text {
    Time.now().toText();
  };

  func createQuest(owner : Principal, date : Text) : Quest {
    let tasks : [Task] = [{
      name = "Push-ups";
      baseAmount = 40;
      completed = false;
    }, {
      name = "Squats";
      baseAmount = 50;
      completed = false;
    }, {
      name = "Sit-ups";
      baseAmount = 40;
      completed = false;
    }, {
      name = "Walking";
      baseAmount = 3;
      completed = false;
    }];

    let quest : Quest = {
      tasks;
      date;
      completed = false;
    };

    quest;
  };

  public query ({ caller }) func getProfile() : async ?Profile {
    profiles.get(caller);
  };

  public query ({ caller }) func getAllProfiles() : async [Profile] {
    profiles.values().toArray().sort();
  };

  public query ({ caller }) func getAllProfilesByLevel() : async [Profile] {
    profiles.values().toArray().sort(Profile.compareByLevel);
  };
};
