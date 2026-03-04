import Map "mo:core/Map";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile type as required by instructions
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile functions as required
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Prayer app specific types
  public type PrayerSettings = {
    calculationMethod : Text;
    madhab : Text;
    locationName : Text;
    latitude : Float;
    longitude : Float;
    notificationsEnabled : Bool;
  };

  public type TasbihCounter = {
    name : Text;
    count : Nat;
    target : Nat;
  };

  let prayerSettings = Map.empty<Principal, PrayerSettings>();
  let tasbihData = Map.empty<Principal, Map.Map<Text, TasbihCounter>>();

  // Prayer settings functions
  public shared ({ caller }) func savePrayerSettings(settings : PrayerSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save settings");
    };
    prayerSettings.add(caller, settings);
  };

  public query ({ caller }) func getCallerPrayerSettings() : async ?PrayerSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access settings");
    };
    prayerSettings.get(caller);
  };

  public query ({ caller }) func getPrayerSettings(user : Principal) : async ?PrayerSettings {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own settings");
    };
    prayerSettings.get(user);
  };

  // Tasbih counter functions
  public shared ({ caller }) func addOrUpdateTasbihCounter(counter : TasbihCounter) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add or update tasbih counters");
    };
    let userTasbihData = switch (tasbihData.get(caller)) {
      case (null) { Map.empty<Text, TasbihCounter>() };
      case (?data) { data };
    };
    userTasbihData.add(counter.name, counter);
    tasbihData.add(caller, userTasbihData);
  };

  public shared ({ caller }) func incrementTasbihCounter(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can increment tasbih counters");
    };
    switch (tasbihData.get(caller)) {
      case (null) { Runtime.trap("Tasbih counter not found") };
      case (?userTasbihData) {
        switch (userTasbihData.get(name)) {
          case (null) { Runtime.trap("Tasbih counter not found") };
          case (?counter) {
            let updatedCounter = {
              name = counter.name;
              count = counter.count + 1;
              target = counter.target;
            };
            userTasbihData.add(name, updatedCounter);
            tasbihData.add(caller, userTasbihData);
          };
        };
      };
    };
  };

  public shared ({ caller }) func resetTasbihCounter(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reset tasbih counters");
    };
    switch (tasbihData.get(caller)) {
      case (null) { Runtime.trap("Tasbih counter not found") };
      case (?userTasbihData) {
        switch (userTasbihData.get(name)) {
          case (null) { Runtime.trap("Tasbih counter not found") };
          case (?counter) {
            let updatedCounter = {
              name = counter.name;
              count = 0;
              target = counter.target;
            };
            userTasbihData.add(name, updatedCounter);
            tasbihData.add(caller, userTasbihData);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteTasbihCounter(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete tasbih counters");
    };
    switch (tasbihData.get(caller)) {
      case (null) { Runtime.trap("Tasbih counter not found") };
      case (?userTasbihData) {
        switch (userTasbihData.get(name)) {
          case (null) { Runtime.trap("Tasbih counter not found") };
          case (?_) {
            userTasbihData.remove(name);
            tasbihData.add(caller, userTasbihData);
          };
        };
      };
    };
  };

  public query ({ caller }) func getCallerTasbihCounters() : async [TasbihCounter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access tasbih counters");
    };
    let userTasbihData = switch (tasbihData.get(caller)) {
      case (null) { Map.empty<Text, TasbihCounter>() };
      case (?data) { data };
    };
    userTasbihData.values().toArray();
  };

  public query ({ caller }) func getTasbihCounters(user : Principal) : async [TasbihCounter] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own tasbih counters");
    };
    let userTasbihData = switch (tasbihData.get(user)) {
      case (null) { Map.empty<Text, TasbihCounter>() };
      case (?data) { data };
    };
    userTasbihData.values().toArray();
  };
};
