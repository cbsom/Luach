import jDate from './jDate';
import Utils from './Utils';

class UserOccasionType {
    static get OneTime() { return 1; }
    static get HebrewDateRecurringYearly() { return 2; }
    static get HebrewDateRecurringMonthly() { return 4; }
    static get SecularDateRecurringYearly() { return 8; }
    static get SecularDateRecurringMonthly() { return 16; }
}

class UserOccasion {
    constructor(title, occasionType, dateAbs, comments, occasionId) {
        this.title = title;
        this.occasionType = occasionType;
        this.dateAbs = dateAbs;
        this.comments = comments;
        this.occasionId = occasionId;
    }
    toString() {
        switch (this.occasionType) {
            case UserOccasionType.OneTime:
                return 'One time event on ' + this.jdate.toString(true) + '  (' +
                    Utils.toStringDate(this.sdate, true) + ')';
            case UserOccasionType.HebrewDateRecurringYearly:
                return 'Yearly event on the ' + Utils.toSuffixed(this.jdate.Day) +
                    ' day of ' + Utils.jMonthsEng[this.jdate.Month];
            case UserOccasionType.HebrewDateRecurringMonthly:
                return 'Monthly event on the ' + Utils.toSuffixed(this.jdate.Day)
                    + ' day of each Jewish month';
            case UserOccasionType.SecularDateRecurringYearly:
                return 'Yearly event on the ' + Utils.toSuffixed(this.sdate.getDate()) +
                    ' day of ' + Utils.sMonthsEng[this.sdate.getMonth()];
            case UserOccasionType.SecularDateRecurringMonthly:
                return 'Monthly event on the ' + Utils.toSuffixed(this.sdate.getDate()) +
                    ' day of each Secular month';
        }
    }
    get jdate() {
        if (!this.jdate) {
            this.jdate = new jDate(this.dateAbs);
        }
        return this.jdate;
    }
    get sdate() {
        if (!this.sdate) {
            this.sdate = jDate.sdFromAbs(this.dateAbs);
        }
        return this.sdate;
    }
    get hasId() {
        return !!this.occasionId;
    }
    static getOccasionsForDate(jdate, allOccasions) {
        return allOccasions.filter(o => {
            switch (o.occasionType) {
                case UserOccasionType.OneTime:
                    return o.dateAbs === jdate.Abs;
                case UserOccasionType.HebrewDateRecurringYearly:
                    return o.Month === jDate.Month && o.Day === jdate.Day;
                case UserOccasionType.HebrewDateRecurringMonthly:
                    return o.Day === jdate.Day;
                case UserOccasionType.SecularDateRecurringYearly:
                case UserOccasionType.SecularDateRecurringMonthly:
                    const sdate1 = jdate.getDate(),
                        sdate2 = o.getDate();
                    if (o.occasionType === UserOccasionType.SecularDateRecurringYearly) {
                        return sdate1.getMonth() === sdate2.getMonth() && sdate1.getDate() === sdate2.getDate();
                    }
                    else {
                        return sdate1.getDate() === sdate2.getDate();
                    }
            }
        });
    }
}

export { UserOccasionType, UserOccasion };