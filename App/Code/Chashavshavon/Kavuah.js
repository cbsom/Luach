import Utils from '../JCal/Utils';
import { Onah, NightDay } from './Onah';
import { setDefault } from '../GeneralUtils';

const KavuahTypes = Object.freeze({
    Haflagah: 1,
    DayOfMonth: 2,
    DayOfWeek: 4,
    Sirug: 8,
    DilugHaflaga: 16,
    DilugDayOfMonth: 32,
    HaflagaMaayanPasuach: 64,
    DayOfMonthMaayanPasuach: 128,
    HafalagaOnahs: 256,
});

class Kavuah {
    /**
     * @param {KavuahTypes} kavuahType
     * @param {Entry} settingEntry
     * @param {number} specialNumber
     * @param {boolean} cancelsOnahBeinunis
     * @param {boolean} active
     * @param {boolean} ignore
     * @param {number} [kavuahId]
     */
    constructor(
        kavuahType,
        settingEntry,
        specialNumber,
        cancelsOnahBeinunis,
        active,
        ignore,
        kavuahId
    ) {
        this.kavuahType = kavuahType;
        //The third entry  - the one that created the chazakah.
        this.settingEntry = settingEntry;
        /*Each type of Kavuah uses the specialNumber in its own way:
            Haflagah  - the number of days
            DayOfMonth - the day of the month
            DayOfWeek - the number of days beteween onahs
            Sirug - the number of months beteween onahs
            DilugHaflaga - number of days to increment (can be negative) number
            DilugDayOfMonth - number of days to increment (can be negative) number
            HaflagaMaayanPasuach and DayOfMonthMaayanPasuach the same as their regular couterparts.
            HaflagaOnahs - the number of Onahs between the Entries */
        this.specialNumber = specialNumber;
        //Does this Kavuah cancel the onah beinonis?
        this.cancelsOnahBeinunis = !!cancelsOnahBeinunis;
        this.active = setDefault(active, true);
        this.ignore = !!ignore;
        this.kavuahId = kavuahId;
    }
    /**
     * Returns true if this Kavuahs type is not dependent on its entries being 3 in a row
     */
    get isIndependent() {
        return [
            KavuahTypes.DayOfMonth,
            KavuahTypes.DayOfMonthMaayanPasuach,
            KavuahTypes.DayOfWeek,
            KavuahTypes.DilugDayOfMonth,
            KavuahTypes.Sirug,
        ].includes(this.kavuahType);
    }
    toString(hideActive) {
        let txt = '';
        if (!hideActive && !this.active) {
            txt = '[INACTIVE] ';
        }
        if (this.ignore) {
            txt = '[IGNORED] ';
        }
        txt +=
            this.settingEntry.nightDay === NightDay.Night
                ? 'Night-time '
                : 'Day-time ';
        switch (this.kavuahType) {
            case KavuahTypes.Haflagah:
                txt += `every ${this.specialNumber.toString()} days`;
                break;
            case KavuahTypes.DayOfMonth:
                txt += `on every ${Utils.toSuffixed(
                    this.specialNumber
                )} day of the Jewish Month`;
                break;
            case KavuahTypes.DayOfWeek:
                txt +=
                    `on the ${
                        Utils.dowEng[this.settingEntry.date.getDayOfWeek()]
                    } ` +
                    `of every ${Utils.toSuffixed(
                        Utils.toInt(this.specialNumber / 7)
                    )} week`;
                break;
            case KavuahTypes.Sirug:
                txt +=
                    `on the ${Utils.toSuffixed(this.settingEntry.day)} ` +
                    `day of every ${Utils.toSuffixed(
                        this.specialNumber
                    )} month`;
                break;
            case KavuahTypes.HaflagaMaayanPasuach:
                txt +=
                    `on every ${this.settingEntry.specialNumber.toString()} ` +
                    'days (through Ma\'ayan Pasuach)';
                break;
            case KavuahTypes.DayOfMonthMaayanPasuach:
                txt +=
                    `on the ${Utils.toSuffixed(this.specialNumber)} day of ` +
                    'the Jewish Month (through Ma\'ayan Pasuach)';
                break;
            case KavuahTypes.DilugHaflaga:
                txt +=
                    'of "Dilug Haflaga" in the interval pattern of "' +
                    (this.specialNumber < 0 ? 'subtract ' : 'add ') +
                    Math.abs(this.specialNumber).toString() +
                    ' days"';
                break;
            case KavuahTypes.DilugDayOfMonth:
                txt +=
                    'of "Dilug Yom Hachodesh" in the interval pattern of "' +
                    (this.specialNumber < 0 ? 'subtract ' : 'add ') +
                    Math.abs(this.specialNumber).toString() +
                    ' days"';
                break;
            case KavuahTypes.HafalagaOnahs:
                txt += `every ${this.specialNumber.toString()} Onahs`;
                break;
        }
        return txt + '.';
    }
    toLongString() {
        let txt = this.toString();
        txt += '\nSetting Entry: ' + this.settingEntry.toLongString();
        if (this.cancelsOnahBeinunis) {
            txt += '\nThis Kavuah cancels the "Onah Beinonis" Flagged Dates.';
        }
        return txt;
    }
    isMatchingKavuah(kavuah) {
        return (
            this.kavuahType === kavuah.kavuahType &&
            this.settingEntry.onah.isSameOnah(kavuah.settingEntry.onah) &&
            this.specialNumber === kavuah.specialNumber
        );
    }
    /**
     * Returns true if the given Entry matches the current Kavuah pattern.
     * @param {Entry} entry The Entry to test.
     * @param {[Entry]} entries The entire list of Entries. This is needed for some Kavuah types.
     * @param {Settings} settings
     */
    isEntryInPattern(entry, entries, settings) {
        if (entry.nightDay !== this.settingEntry.nightDay) {
            return false;
        }
        //Each Kavuah type has its own pattern
        switch (this.kavuahType) {
            case KavuahTypes.Haflagah:
                return entry.haflaga === this.specialNumber;
            case KavuahTypes.DayOfMonth:
                return entry.day === this.specialNumber;
            case KavuahTypes.Sirug: {
                const previous = entries[entries.indexOf(entry) - 1];
                return (
                    previous &&
                    entry.day === this.settingEntry.day &&
                    previous.date.diffMonths(entry.date) === this.specialNumber
                );
            }
            case KavuahTypes.DilugHaflaga: {
                const previous = entries[entries.indexOf(entry) - 1];
                return (
                    previous &&
                    entry.haflaga === previous.haflaga + this.specialNumber
                );
            }
            case KavuahTypes.DilugDayOfMonth:
            case KavuahTypes.DayOfWeek: {
                const iters = Kavuah.getIndependentIterations(
                    this,
                    entry.date,
                    settings && settings.dilugChodeshPastEnds
                );
                return iters.some(o => entry.isSameOnah(o));
            }
        }
        return false;
    }

    get hasId() {
        return !!this.kavuahId;
    }
    /**
     * Tries to determine if the specialNumber correctly matches the information in the settingEntry
     */
    get specialNumberMatchesEntry() {
        if (!this.specialNumber) {
            return false;
        }
        switch (this.kavuahType) {
            case KavuahTypes.Haflagah:
            case KavuahTypes.HaflagaMaayanPasuach:
                return (
                    this.specialNumber > 0 &&
                    (this.specialNumber === this.settingEntry.haflaga ||
                        !this.settingEntry.haflaga)
                );
            case KavuahTypes.DayOfMonth:
            case KavuahTypes.DayOfMonthMaayanPasuach:
                return (
                    this.specialNumber > 0 &&
                    this.specialNumber <= 30 &&
                    this.specialNumber === this.settingEntry.day
                );
            case KavuahTypes.HafalagaOnahs:
                return this.specialNumber > 0;
            default:
                return true;
        }
    }
    /**
     * Returns a list of Onahs that theortically should have Entries on them
     * according to the pattern of the given Kavuah.
     * Only applicable to "Independent" type Kavuahs.
     * @param {Kavuah} kavuah The kavuah to get the list for
     * @param {jDate} jdate The date until when to work out the theoretical iterations.
     * @param {boolean} dilugChodeshPastEnds
     * @returns {[Onah]}
     */
    static getIndependentIterations(kavuah, jdate, dilugChodeshPastEnds) {
        let iterations = [];
        if (kavuah.isIndependent) {
            if (kavuah.kavuahType === KavuahTypes.DayOfWeek) {
                iterations = Kavuah.getDayOfWeekIterations(kavuah, jdate);
            } else if (kavuah.kavuahType === KavuahTypes.DilugDayOfMonth) {
                iterations = Kavuah.getDilugDayOfMonthIterations(
                    kavuah,
                    jdate,
                    dilugChodeshPastEnds
                );
            } else {
                let nextIteration = kavuah.settingEntry.date;
                while (nextIteration.Abs < jdate.Abs) {
                    nextIteration = nextIteration.addMonths(
                        //Go to the next month. Sirug Kavuahs add more than one month
                        kavuah.kavuahType === KavuahTypes.Sirug
                            ? kavuah.specialNumber
                            : 1
                    );
                    iterations.push(
                        new Onah(nextIteration, kavuah.settingEntry.nightDay)
                    );
                }
            }
        }
        return iterations;
    }
    /**
     * Returns a list of Onahs that theortically should have Entries on them
     * according to the pattern of this DayOfWeek Kavuah.
     * @param {Kavuah} kavuah The kavuah to get the list for
     * @param {jDate} jdate The date until when to work out the theoretical iterations.
     * @returns {[Onah]}
     */
    static getDayOfWeekIterations(kavuah, jdate) {
        const iterations = [];
        if (kavuah.kavuahType === KavuahTypes.DayOfWeek) {
            let nextIteration = kavuah.settingEntry.date;
            while (nextIteration.Abs < jdate.Abs) {
                nextIteration = nextIteration.addDays(kavuah.specialNumber);
                iterations.push(
                    new Onah(nextIteration, kavuah.settingEntry.nightDay)
                );
            }
        }
        return iterations;
    }
    /**
     * Returns a list of Onahs that theortically should have Entries on them
     * according to the pattern of the given DilugDayOfMonth Kavuah.
     * @param {Kavuah} kavuah The kavuah to get the list for
     * @param {jDate} jdate The date until when to work out the theoretical iterations.
     * @param {boolean} dilugChodeshPastEnds Continue incrementing into another month?
     * @returns {[Onah]}
     */
    static getDilugDayOfMonthIterations(kavuah, jdate, dilugChodeshPastEnds) {
        const iterations = [];

        if (kavuah.kavuahType === KavuahTypes.DilugDayOfMonth) {
            let nextMonth = kavuah.settingEntry.date;
            for (let i = 1; ; i++) {
                nextMonth = nextMonth.addMonths(1);
                const nextIteration = nextMonth.addDays(
                    kavuah.specialNumber * i
                );
                if (
                    nextIteration.Abs > jdate.Abs ||
                    nextIteration.Abs <= kavuah.settingEntry.abs
                ) {
                    break;
                }
                //dilugChodeshPastEnds means continue incrementing Dilug Yom Hachodesh Kavuahs into another month.
                if (
                    !dilugChodeshPastEnds &&
                    //If the current iterations Day is more than the setting entries Day
                    //and the Dilug is a positive number, than we have slided into another month.
                    //And vice versa.
                    Math.sign(kavuah.settingEntry.day - nextIteration.Day) ===
                        Math.sign(kavuah.specialNumber)
                ) {
                    break;
                }
                iterations.push(
                    new Onah(nextIteration, kavuah.settingEntry.nightDay)
                );
            }
        }
        return iterations;
    }
    /**
     * Get possible new Kavuahs from a list of entries.
     * @param {[Entry]} realEntrysList List of entries to search. All should be not ignoreForFlaggedDates.
     * @param {[Kavuah]} kavuahList The list of Kavuahs to used to determine if any found kavuah is a "new" one.
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getPossibleNewKavuahs(realEntrysList, kavuahList, settings) {
        //Get all Kavuahs in the list that are active - including ignored ones.
        const klist = kavuahList.filter(k => k.active);
        //Find all possible Kavuahs.
        return (
            Kavuah.getKavuahSuggestionList(realEntrysList, kavuahList, settings)
                //Filter out any Kavuahs that are already in the active list.
                //Ignored Kavuahs will also not be returned.
                .filter(pk => !klist.find(k => k.isMatchingKavuah(pk.kavuah)))
        );
    }
    /**
     * Works out all possible Kavuahs from the given list of entries
     * Returns an array of objects, each containing:
     * {
     *      kavuah: the found Kavuah object
     *      entries: an array of the 3 or 4 Entry objects that were found to have a possible Kavuah relationship.
     * }
     * @param {[Entry]} realEntrysList
     * @param {[Kavuah]} previousKavuahs
     * @param {Settings} settings
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getKavuahSuggestionList(realEntrysList, previousKavuahs, settings) {
        let kavuahList = [];
        const queue = [];

        for (let entry of realEntrysList.filter(e => !e.ignoreForKavuah)) {
            //First we work out those Kavuahs that are not dependent on their entries being 3 in a row
            kavuahList = kavuahList
                .concat(
                    Kavuah.getDayOfMonthKavuah(entry, realEntrysList, settings)
                )
                .concat(
                    Kavuah.getDayOfWeekKavuahs(entry, realEntrysList, settings)
                );

            //If there are no previous active Kavuahs of type DayOfMonth for the date of this entry,
            //we can look for a Dilug Day of Month Kavuah of just three entries. [Sha"ch yr"d 189, 7]
            if (
                !previousKavuahs ||
                !previousKavuahs.some(
                    k =>
                        k.active &&
                        k.kavuahType === KavuahTypes.DayOfMonth &&
                        k.specialNumber === entry.date.Day
                )
            ) {
                kavuahList = kavuahList.concat(
                    Kavuah.getDilugDayOfMonthKavuah(
                        entry,
                        realEntrysList,
                        settings
                    )
                );
            }

            /*For calculating all other Kavuahs, we use a queue of 3 or 4 entries in a row.*/

            //Add the entry of the current iteration to the end of the queue.
            queue.push(entry);
            //if the queue is too "full"
            if (queue.length > 4) {
                //pop out the earliest one - leaves us with just this entry and the previous 3.
                queue.shift();
            }

            //To calculate a Sirug Kavuah, we need just 3 entries
            if (
                queue.length >= 3 &&
                (settings.kavuahDiffOnahs ||
                    (queue[0].nightDay === queue[1].nightDay &&
                        queue[1].nightDay === queue[2].nightDay))
            ) {
                //We only need three entries for a sirug kavuah.
                //We always send the last 3 entries as the last one is always the newly added one.
                kavuahList = kavuahList.concat(
                    Kavuah.getSirugKavuah(queue.slice(-3))
                );
            }
            //We can't start calculating haflaga kavuahs until we have 4 entries
            if (queue.length === 4) {
                //Haflaga Kavuahs need the latter 3 entries to have the same nightDay () -
                //unless kavuahDiffOnahs is on.
                //The first entry of the 4, does not have to be
                //the same NightDay as the other three. [Nodah Biyehuda (2, 83), See Chazon Ish (85, 59-)]
                if (
                    (queue[1].nightDay === queue[2].nightDay &&
                        queue[2].nightDay === queue[3].nightDay) ||
                    settings.kavuahDiffOnahs
                ) {
                    kavuahList = kavuahList
                        .concat(Kavuah.getHaflagahKavuah(queue))
                        .concat(Kavuah.getDilugHaflagahKavuah(queue));
                }

                //The Kavuah of Haflaga of Onahs - the Shulchan Aruch Harav
                //If the NightDays of the latter 3 are the same, there will always already be a Haflaga Kavuah.
                if (
                    settings.haflagaOfOnahs &&
                    queue[1].nightDay !== queue[2].nightDay
                ) {
                    kavuahList = kavuahList.concat(
                        Kavuah.getHaflagaOnahsKavuah(queue)
                    );
                }
            }
        }

        return kavuahList;
    }
    /**
     * See if there the pattern of a DayOfMonth Kavuah in the given list of Entries.
     * @param {Entry} entry The Entry to start from
     * @param {[Entry]} entryList The full list of Entries to search through
     * @param {Settings} settings
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getDayOfMonthKavuah(entry, entryList, settings) {
        const list = [],
            nextMonth = entry.date.addMonths(1),
            thirdMonth = nextMonth.addMonths(1);
        //We look for an entry that is exactly one Jewish month later
        //Note, it is irrelevant if there were other entries in the interim
        const secondFind = entryList.find(
            en =>
                (settings.kavuahDiffOnahs ||
                    en.onah.nightDay === entry.onah.nightDay) &&
                Utils.isSameJdate(en.date, nextMonth)
        );
        if (secondFind) {
            //Now we look for another entry that is exactly two Jewish months later
            const thirdFind = entryList.find(
                en =>
                    (settings.kavuahDiffOnahs ||
                        en.onah.nightDay === entry.onah.nightDay) &&
                    Utils.isSameJdate(en.date, thirdMonth)
            );
            if (thirdFind) {
                list.push({
                    kavuah: new Kavuah(
                        KavuahTypes.DayOfMonth,
                        thirdFind,
                        thirdMonth.Day
                    ),
                    entries: [entry, secondFind, thirdFind],
                });
            }
        }
        return list;
    }
    /**
     * See if there the pattern of a DilugDayOfMonth Kavuah in the given list of Entries.
     * @param {Entry} entry The Entry to start from
     * @param {[Entry]} entryList The full list of Entries to search through
     * @param {Settings} settings
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getDilugDayOfMonthKavuah(entry, entryList, settings) {
        const list = [];
        //First, we look for any entry that is in the next Jewish month after the given entry -
        //but not on the same day as that would be a regular DayOfMonth Kavuah with no Dilug.
        //Note, it is irrelevant if there were other entries in the interim
        const nextMonth = entry.date.addMonths(1),
            secondFind = entryList.find(
                en =>
                    (settings.kavuahDiffOnahs ||
                        en.nightDay === entry.nightDay) &&
                    nextMonth.Day !== en.day &&
                    nextMonth.Month === en.month &&
                    nextMonth.Year === en.year
            );
        if (secondFind) {
            //Now we look for another entry that is in the 3rd month and has the same "Dilug" as the previous find
            const thirdMonth = entry.date.addMonths(2),
                dilugDays = secondFind.day - entry.day,
                finalFind = entryList.find(
                    en =>
                        (settings.kavuahDiffOnahs ||
                            en.nightDay === entry.nightDay) &&
                        en.day - secondFind.day === dilugDays &&
                        thirdMonth.Month === en.month &&
                        thirdMonth.Year === en.year
                );
            if (finalFind) {
                list.push({
                    kavuah: new Kavuah(
                        KavuahTypes.DilugDayOfMonth,
                        finalFind,
                        dilugDays
                    ),
                    entries: [entry, secondFind, finalFind],
                });
            }
        }
        return list;
    }
    /**
     * See if there the pattern of a DayOfWeek Kavuah in the given list of Entries.
     * @param {Entry} entry The Entry to start from
     * @param {[Entry]} entryList The full list of Entries to search through
     * @param {Settings} settings
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getDayOfWeekKavuahs(entry, entryList, settings) {
        const list = [];

        //We go through the proceeding entries in the list looking for those that are on the same day of the week as the given entry
        //Note, similar to Yom Hachodesh based kavuahs, it is irrelevant if there were other entries in the interim (משמרת הטהרה)
        for (let firstFind of entryList.filter(
            e =>
                (settings.kavuahDiffOnahs || e.nightDay === entry.nightDay) &&
                e.abs > entry.abs &&
                e.dayOfWeek === entry.dayOfWeek
        )) {
            //We get the interval in days between the found entry and the given entry
            const interval = entry.date.diffDays(firstFind.date),
                nextDate = firstFind.date.addDays(interval);

            //If the next date has the same day of the week, we will check if there is an Entry on that day.
            if (entry.dayOfWeek === nextDate.DayOfWeek) {
                //We now look for a second entry that is also on the same day of the week
                //and that has the same interval from the previously found entry
                const secondFind = entryList.find(
                    en =>
                        (settings.kavuahDiffOnahs ||
                            en.nightDay === entry.nightDay) &&
                        Utils.isSameJdate(en.date, nextDate)
                );
                if (secondFind) {
                    list.push({
                        kavuah: new Kavuah(
                            KavuahTypes.DayOfWeek,
                            secondFind,
                            interval
                        ),
                        entries: [entry, firstFind, secondFind],
                    });
                }
            }
        }
        return list;
    }
    /**
     * See if there the pattern of a Haflagah Kavuah in the given list of Entries.
     * @param {[Entry]} fourEntries The Entry list
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getHaflagahKavuah(fourEntries) {
        const list = [];
        //We simply compare the intervals between the entries. If they are the same, we have a Kavuah
        if (
            fourEntries[1].haflaga === fourEntries[2].haflaga &&
            fourEntries[2].haflaga === fourEntries[3].haflaga
        ) {
            list.push({
                kavuah: new Kavuah(
                    KavuahTypes.Haflagah,
                    fourEntries[3],
                    fourEntries[3].haflaga
                ),
                entries: [...fourEntries],
            });
        }
        return list;
    }
    /**
     * See if there the pattern of a HaflagahOnahs Kavuah in the given list of Entries.
     * @param {[Entry]} fourEntries The Entry list
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getHaflagaOnahsKavuah(fourEntries) {
        const list = [],
            onahs = fourEntries[0].getOnahDifferential(fourEntries[1]);

        //We compare the intervals of onahs between the entries.
        //If they are the same, we have a Kavuah
        if (
            fourEntries[1].getOnahDifferential(fourEntries[2]) === onahs &&
            fourEntries[2].getOnahDifferential(fourEntries[3]) === onahs
        ) {
            list.push({
                kavuah: new Kavuah(
                    KavuahTypes.HafalagaOnahs,
                    fourEntries[3],
                    onahs
                ),
                entries: [...fourEntries],
            });
        }
        return list;
    }
    /**
     * See if there the pattern of a Sirug Kavuah in the given list of Entries.
     * @param {[Entry]} threeEntries The Entry list
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getSirugKavuah(threeEntries) {
        // Caculate Kavuah of Sirug
        // We go here according to those that Sirug Kavuahs need 3 in a row with no intervening entries
        const list = [],
            //We get the difference in months between the first 2 entries
            monthDiff = threeEntries[0].date.diffMonths(threeEntries[1].date);
        //If the difference is 1, than it can not be a Sirug Kavuah - rather it may be a DayOfMonth kavuah.
        //We now check to see if the third Entry is the same number of months
        //after the second one, and that all 3 entries are on the same day of the month.
        if (
            monthDiff > 1 &&
            threeEntries[0].day === threeEntries[1].day &&
            threeEntries[1].day === threeEntries[2].day &&
            threeEntries[1].date.diffMonths(threeEntries[2].date) === monthDiff
        ) {
            //Add the kavuah
            list.push({
                kavuah: new Kavuah(
                    KavuahTypes.Sirug,
                    threeEntries[2],
                    monthDiff
                ),
                entries: [...threeEntries],
            });
        }
        return list;
    }
    /**
     * See if there the pattern of a DilugHaflagah Kavuah in the given list of Entries.
     * @param {[Entry]} fourEntries The Entry list
     * @returns {[{kavuah:Kavuah,entries:[Entry]}]}
     */
    static getDilugHaflagahKavuah(fourEntries) {
        // Caculate Dilug Haflaga Kavuahs
        const list = [],
            //We check the entries if their interval "Dilug"s are the same.
            haflagaDiff1 = fourEntries[3].haflaga - fourEntries[2].haflaga,
            haflagaDiff2 = fourEntries[2].haflaga - fourEntries[1].haflaga;

        //If the "Dilug" is 0 it may be a regular Kavuah of Haflagah but not a Dilug one
        if (haflagaDiff1 !== 0 && haflagaDiff1 === haflagaDiff2) {
            list.push({
                kavuah: new Kavuah(
                    KavuahTypes.DilugHaflaga,
                    fourEntries[3],
                    haflagaDiff1
                ),
                entries: [...fourEntries],
            });
        }
        return list;
    }
    /**
     * Searches for any active Kavuahs in the given list that the given entry breaks its pattern
     * by being the 3rd one that is out-of-pattern.
     * @param {Entry} entry The entry that nessesitated this calculation
     * @param {[Kavuah]} kavuahList
     * @param {[Entry]} entries An array of Entries that is sorted chronologically.
     * @param {Settings} settings
     * @returns {[Kavuah]}
     */
    static findBrokenKavuahs(entry, kavuahList, entries, settings) {
        return [
            ...Kavuah.findIndependentBrokens(
                entry.date,
                kavuahList,
                entries,
                settings
            ),
            ...Kavuah.findNonIndependentBrokens(entry, kavuahList, entries),
        ];
    }
    /**
     * Find broken Kavuahs whose type is "Independent"
     * meaning that they do not care if there were other Entries in middle.
     * @param {jDate} jdate
     * @param {[Kavuah]} kavuahList
     * @param {[Entry]} entries
     * @param {Settings} settings
     * @returns {[Kavuah]}
     */
    static findIndependentBrokens(jdate, kavuahList, entries, settings) {
        const brokens = [];

        //Check the last three theoretical iterations of all the "Independent" type Kavuahs
        for (let kavuah of kavuahList.filter(
            k =>
                k.active &&
                !k.ignore &&
                k.isIndependent &&
                k.settingEntry.abs < jdate.Abs
        )) {
            //Get the last three "iterations" of the Kavuah - up to the given date
            const last3Iters = Kavuah.getIndependentIterations(
                kavuah,
                jdate,
                settings.dilugChodeshPastEnds
            ).slice(-3);
            if (
                last3Iters.length === 3 &&
                !last3Iters.some(o => entries.some(e => e.isSameOnah(o)))
            ) {
                brokens.push(kavuah);
            }
        }
        return brokens;
    }
    /**
     * Find Kavuahs that have had their pattern "broken" by the given Entry.
     * Only active non-independent kavuahs that were set before the last 3 Entries are considered.
     * @param {Entry} entry
     * @param {[Kavuah]} kavuahList
     * @param {[Entry]} entries
     * @returns {[Kavuah]}
     */
    static findNonIndependentBrokens(entry, kavuahList, entries) {
        const brokens = [],
            index = entries.indexOf(entry);
        //If there aren't at least 2 previous Entries,
        //no Kavuah could have been broken by this Entry.
        if (index > 1) {
            const lastThree = entries.slice(index - 2, index + 1);
            for (let kavuah of kavuahList.filter(
                k =>
                    k.active &&
                    !k.ignore &&
                    !k.isIndependent &&
                    lastThree.every(e => e.Abs > k.settingEntry.abs)
            )) {
                if (!lastThree.some(e => kavuah.isEntryInPattern(e, entries))) {
                    brokens.push(kavuah);
                }
            }
        }
        return brokens;
    }
    /**
     * Searches for Kavuahs in the given list that the given entry is out of pattern with.
     * The only kavuahs considered are active ones that cancel onah beinonis
     * and that were set before this Entry occurred.
     * @param {Entry} entry
     * @param {[Kavuah]} kavuahList
     * @param {[Entry]} entries An array of Entries that is sorted chronologically.
     * Used to get the previous Entry.
     * * @param {Settings} settings
     * @returns {[Kavuah]}
     */
    static findOutOfPattern(entry, kavuahList, entries, settings) {
        const list = [];
        for (let kavuah of kavuahList.filter(
            k =>
                k.cancelsOnahBeinunis &&
                k.active &&
                !k.ignore &&
                //"Independent" Kavuahs are not considered "out of pattern" if there is an Entry in middle
                !k.isIndependent &&
                k.settingEntry.abs < entry.abs
        )) {
            if (!kavuah.isEntryInPattern(entry, entries, settings)) {
                list.push(kavuah);
            }
        }
        return list;
    }
    /**
     * Searches for inactive Kavuahs in the given list that the given entry is "in pattern" with.
     * The only kavuahs considered are those that were set before this Entry occurred.
     * @param {Entry} entry
     * @param {[Kavuah]} kavuahList
     * @param {[Entry]} entries An array of Entries that is sorted chronologically.  Used to get the previous Entry.
     * @param {Settings} settings
     * @returns {[Kavuah]}
     */
    static findReawakenedKavuahs(entry, kavuahList, entries, settings) {
        const awakened = [];
        for (let kavuah of kavuahList.filter(
            k =>
                !k.active &&
                !k.ignore &&
                k.settingEntry.abs < entry.abs
        )) {
            if (kavuah.isEntryInPattern(entry, entries, settings)) {
                awakened.push(kavuah);
            }
        }
        return awakened;
    }
    /**
     * Gets the default special number for the given Kavuah description
     * @param {Entry} settingEntry
     * @param {KavuahTypes} kavuahType
     * @param {[Entry]} entryList
     * @returns {number}
     */
    static getDefaultSpecialNumber(settingEntry, kavuahType, entryList) {
        if (
            settingEntry.haflaga &&
            [KavuahTypes.Haflagah, KavuahTypes.HaflagaMaayanPasuach].includes(
                kavuahType
            )
        ) {
            return settingEntry.haflaga;
        } else if (
            [
                KavuahTypes.DayOfMonth,
                KavuahTypes.DayOfMonthMaayanPasuach,
            ].includes(kavuahType)
        ) {
            return settingEntry.day;
        } else if (kavuahType === KavuahTypes.HafalagaOnahs) {
            const index = entryList.findIndex(e => e.isSameEntry(settingEntry)),
                //The entries are sorted latest to earlier
                previous = entryList[index + 1];
            if (previous) {
                return previous.getOnahDifferential(settingEntry);
            }
        }
    }
    /**
     * Returns the definition text of the what the special number represents
     * for the given Kavuah Type.
     * @param {KavuahTypes} kavuahType
     * @returns {string}
     */
    static getNumberDefinition(kavuahType) {
        switch (kavuahType) {
            case KavuahTypes.DayOfMonth:
            case KavuahTypes.DayOfMonthMaayanPasuach:
                return 'Day of each Jewish Month';
            case KavuahTypes.DayOfWeek:
                return 'Number of days between entries (Haflaga)';
            case KavuahTypes.Haflagah:
            case KavuahTypes.HaflagaMaayanPasuach:
                return 'Number of days between entries (Haflaga)';
            case KavuahTypes.DilugDayOfMonth:
                return 'Number of days to add/subtract each month';
            case KavuahTypes.DilugHaflaga:
                return 'Number of days to add/subtract to Haflaga each Entry';
            case KavuahTypes.HafalagaOnahs:
                return 'Number of Onahs between entries (Haflaga of Shulchan Aruch Harav)';
            case KavuahTypes.Sirug:
                return 'Number of months separating the Entries';
            default:
                return 'Kavuah Defining Number';
        }
    }
    /**
     * Get the display text for the given Kavuah Type
     * @param {KavuahTypes} kavuahType
     * @returns {string}
     */
    static getKavuahTypeText(kavuahType) {
        switch (kavuahType) {
            case KavuahTypes.DayOfMonth:
                return 'Day of Month';
            case KavuahTypes.DayOfMonthMaayanPasuach:
                return 'Day Of Month with Ma\'ayan Pasuach';
            case KavuahTypes.DayOfWeek:
                return 'Day of week';
            case KavuahTypes.DilugDayOfMonth:
                return '"Dilug" of Day Of Month';
            case KavuahTypes.DilugHaflaga:
                return '"Dilug" of Haflaga';
            case KavuahTypes.HafalagaOnahs:
                return 'Haflaga of Onahs';
            case KavuahTypes.Haflagah:
                return 'Haflaga';
            case KavuahTypes.HaflagaMaayanPasuach:
                return 'Haflaga with Ma\'ayan Pasuach';
            case KavuahTypes.Sirug:
                return 'Sirug';
        }
    }
}

export { KavuahTypes, Kavuah };
