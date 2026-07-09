<!-- page 106 -->

```
ELSE THE APPROPRIATE PHASER BANK IS NOT OPERATIONAL :
    SO NOTIFY THE HELMSMAN .
ENDIF
ELSE THE SPECIFIED COORDINATES ARE NOT WITHIN THE UNIVERSE :
    SO NOTIFY THE HELMSMAN .
ENDIF
RETURN//


< ****************************************************** >
< HELM FIRE PHOTON TORPEDO AT SPECIFIED OBJECT SUBMODULE (4) >
DETERMINE WHETHER THE SPECIFIED OBJECT IS KNOWN ;
< IT MAY BE A CELESTIAL OBJECT, A FEDERATION OR ENEMY SPACE
< CRAFT OR A SHUTTLECRAFT .
IF THE SPECIFIED OBJECT IS KNOWN :
    IF THERE IS AN OPERATIONAL TORPEDO STATION WITH AN UNUSED
    PHOTON TORPEDO :
        SET THE DESTINATION OF THE TORPEDO TO THE SPECIFIED OBJECT ;
        REDUCE THE ENTERPRISE'S ENERGY SUPPLY ACCORDINGLY .
    ELSE THERE IS NO OPERATIONAL TORPEDO STATION WITH AN
    UNUSED PHOTON TORPEDO :
        SO NOTIFY THE HELMSMAN .
    ENDIF
ELSE THE SPECIFIED OBJECT IS NOT KNOWN :
    SO NOTIFY THE HELMSMAN .
ENDIF
RETURN//


< ****************************************************** >
< HELM FIRE PHOTON TORPEDO AT COORDINATES SUBMODULE (4) >
< NOTE: AN UNUSED PHOTON TORPEDO IS ONE WHOSE LOCATION IS AT
< A TORPEDO STATION BUT WHOSE DESTINATION IS 'NONE' .
IF THE SPECIFIED COORDINATES ARE WITHIN THE UNIVERSE :
    IF THERE IS AN OPERATIONAL TORPEDO STATION WITH AN UNUSED
    PHOTON TORPEDO :
        SET THE DESTINATION FOR THE PHOTON TORPEDO TO THE
        SPECIFIED COORDINATES ;
        SET ITS DESTINATION CODE TO -1 ;
        UPDATE THE ENTERPRISE'S ENERGY SUPPLY ACCORDINGLY .
    ELSE THERE IS NO OPERATIONAL PHOTON TORPEDO STATION WITH
    AN UNUSED PHOTON TORPEDO :
        SO NOTIFY THE HELMSMAN .
    ENDIF
ELSE THE SPECIFIED COORDINATES ARE NOT WITHIN THE UNIVERSE :
    SO NOTIFY THE HELMSMAN .
ENDIF
RETURN//


< ****************************************************** >
< HELM SET DEFLECTOR SHIELD SUBMODULE (4) >
IF ALL SHIELDS WAS SPECIFIED IN THE COMMAND :
    IF THE SPECIFIED SHIELD LEVEL IS WITHIN LIMITS :
```

<!-- page 107 -->

```
    THEN SET THE OPERATIONAL STATUS OF ALL SIX DEFLECTOR
    SHIELDS TO THE SPECIFIED LEVEL .
ELSE THE SPECIFIED LEVEL IS NOT WITHIN LIMITS (0 - 100%) :
    SO NOTIFY THE HELMSMAN .
ENDIF
ORIF A SPECIFIC SHIELD WAS SPECIFIED :
    IF THE SPECIFIED SHIELD LEVEL IS WITHIN LIMITS (0 - 100%) :
        THEN SET THE OPERATIONAL STATUS OF THE SPECIFIED SHIELD TO
        THE SPECIFIED LEVEL .
    ELSE THE SPECIFIED LEVEL WAS NOT WITHIN LIMITS (0 -100%) :
        SO NOTIFY THE HELMSMAN .
    ENDIF
ELSE THE SPECIFIED SHIELD IS UNKNOWN :
    SO NOTIFY THE HELMSMAN .
ENDIF
RETURN//


< ****************************************************** >
< HELM INFLICT DAMAGE SUBMODULE (5) >
< THE TARGET THAT RECEIVES THE DAMAGE AND THE WEAPON THAT IS
< INFLICTING THE DAMAGE IS SPECIFIED BY THE LEVEL 4 SUBMODULE
< WHICH CALLS THIS SUBROUTINE.
< IN GENERAL, THE DAMAGE INFLICTED DEPENDS UPON THE FOLLOWING:
<
< 1. TYPE, FUNCTIONAL AND OPERATIONAL STATUS, AND RELIABILITY
<    FACTOR OF THE WEAPON.
< 2. DISTANCE FROM THE WEAPON TO THE TARGET.
<    NOTE THAT A PHOTON TORPEDO MAY DETONATE NEAR A TARGET,
<    NOT NECESSARILY DIRECTLY ON THE TARGET.
< 3. THE SHIELD LEVEL OF THE TARGET. IF THE SHIELDS ARE UP THEN
<    A PROPORTIONATE LEVEL OF THE DAMAGE WILL BE APPLIED TO
<    THE SHIELDS.
<
DETERMINE THE ATTRIBUTES OF THE TARGET WHICH ARE SUBJECT TO
DAMAGE ;
< FUNCTIONAL STATUS, HEALTH, INTELLIGENCE, POLLUTION LEVEL,
< QUANTITY, QUALITY, AND RELIABILITY FACTOR ATTRIBUTES.
SET THE 'TENTATIVE DAMAGE' OF EACH OF THE TARGET ATTRIBUTES
IDENTIFIED ABOVE TO 100% ;
DETERMINE THE 'BLAST IMPACT' OF THE WEAPON ;
< THIS IS DIRECTLY PROPORTIONAL TO THE FUNCTIONAL STATUS OF
< THE WEAPON, INVERSELY PROPORTIONAL TO THE RELIABILITY
< FACTOR OF THE WEAPON, INVERSELY PROPORTIONAL TO THE
< DISTANCE BETWEEN THE ENTERPRISE AND THE TARGET (FOR PHASERS)
< OR BETWEEN THE LOCATION OF THE PHOTON TORPEDO WARHEAD
< AND THE TARGET (FOR PHOTON TORPEDOES) .
DETERMINE THE NUMBER OF TARGET ATTRIBUTES WHICH WILL BE
AFFECTED BY THE BLAST ;
< THIS WILL BE RELATED TO THE DISTANCE (AS NOTED ABOVE), THE
< BLAST IMPACT, A RANDOM FUNCTION, AND THE OPERATIONAL
< STATUS OF THE TARGET DEFLECTOR SHIELDS .
DETERMINE WHICH OF THE TARGET ATTRIBUTES ARE TO BE DAMAGED ;
< THIS IS A RANDOM CHOICE BUT IF THE DEFLECTOR SHIELDS OF THE
```

<!-- page 108 -->

```
< TARGET ARE ON THEN THEY MUST BE INCLUDED IN THE ATTRIBUTES
< TO BE AFFECTED .
SET THE 'TENTATIVE DAMAGE' FOR ALL OF THE TARGET ATTRIBUTES
NOT SELECTED TO RECEIVE DAMAGE TO 0% ;
DISTRIBUTE THE 'BLAST EFFECT' RANDOMLY OVER THE TARGET
ATTRIBUTES WHICH WERE SELECTED TO RECEIVE DAMAGE ;
< (E.G. IF THE BLAST EFFECT IS 50% AND THERE ARE TWO TARGET
< ATTRIBUTES WHICH WERE SELECTED TO RECEIVE DAMAGE THEN ONE
< MIGHT RECEIVE 20% AND THE OTHER 30% .
< IF THE TARGET DEFLECTOR SHIELDS ARE ON THEN THE TARGET'S
< DEFLECTOR SHIELD ATTRIBUTE SHOULD RECEIVE A LARGE SHARE
< OF THE 'BLAST EFFECT' .
APPLY THE BLAST EFFECT BY CHANGING THE TARGET ATTRIBUTES
PROPORTIONAL TO THE ASSOCIATED 'TENTATIVE DAMAGE' ;
< E.G. FUNCTIONAL STATUS WOULD BE DECREASED 15% FOR AN
< ASSOCIATED TENTATIVE DAMAGE OF 15%, RELIABILITY FACTOR
< WOULD INCREASE 7% FOR AN ASSOCIATED TENTATIVE DAMAGE OF 7%.
RETURN//
```

### GENERAL NOTES

1. *Setting to nominal* means setting the associated variables to some predetermined value, often a mid-range or maximum value. For example, when setting the celestial data to nominal it might entail creating the maximum number of celestial objects with a roughly even distribution throughout the universe.

2. Many subroutines specify to *NOTIFY THE OFFICER*. This is a general term used to indicate that some message should be transmitted to the named officer. It may be done by displaying the message on the console in the *alerts* section or by announcing it orally if a computer-controlled voice-synthesizer is available.

Generally those messages which are warnings to the officer, such as when he inputs an invalid command, would be displayed in the *ALERTS* area of his display. Those messages which are meant to come from other Federation or enemy craft and the like would be sent to the communications module message area.

3. The abbreviation *TBD* is used throughout the logic flow definitions. TBD stands for To Be Determined and is used to describe those constants, variables, and relationships which can only be determined by running the simulation. It is left to the programmer to define them after he has exercised the routines.

### LOGIC FLOW CODE

The purpose of this book has been to present the methods employed in designing a simulation and then to present the descriptions of the STAR SHIP simulation as an example. Since

<!-- page 109 -->

there are a great variety of programming languages and hardware systems available no attempt is made here to define the actual executable code. It would be an impossible task to provide an actual implementation which would satisfy every reader.

The logic flow definitions, however, have been given in such detail and been written utilizing English-form structured programming constructs that it should be a relatively easy and straightforward exercise for the reader to make the transformation to his particular software. Several examples have already been given in CODING THE LOGIC FLOW in chapter 2 of how to make the translation. Before writing any code, however, it is advisable to read through the next section on testing and the final chapter on implementation.

### TEST PROCEDURES

The modules should be coded top to bottom. That is, the Simulation Controller and Common Data areas first. Testing of the top level can then be done by coding stubs for each of the remaining modules. A *stub* is a module or subroutine which has an entry point and an exit point (return) but no actual code except, perhaps, for a tracing output message such as *GOT TO THE MEDICAL MODULE*. Each of the subfunctions and operator commands should be tested separately, utilizing tracing functions for each. One particular type of trace would be one which writes out the common data variable values at critical points throughout the module so that it can be determined whether they are being updated properly.

Only after the Simulation Controller has been thoroughly checked should another module be added to replace its stub and then be checked out.

After all modules have been thoroughly debugged using tracing features, a sample scenario which will exercise all functions should be run (with traces still intact). The first scenario run should be done without any operator input. The test is to see if the module responds correctly to the scenario by itself. Observations are done by watching the trace output and the module displays. When it is certain that everything is working properly the full scale running of the system with or without the scenario and with full operator input can begin.

Trace functions should be removed as the programmer gains confidence in the associated modules. The final phase of testing

<!-- page 110 -->

is adjusting the constants and relationships which were initially educated guesses. This will include such things as how much damage should be done when a target gets hit by a phaser, how quickly the food supply should be consumed, the relationship of target mass to tractor beam operational status, and so on. Since in this simulation much of this information was not available during the design phase it now becomes the task of the programmer in conjunction with the operators to adjust the constants and relationships until the responses are *realistic*. In this case realistic means whatever the operators feel is reasonable and fair. Certainly allowing the STAR SHIP infinite energy or undamagable shield screens would be both unreasonable and unfair.

In other simulations which are designed to imitate actual known physical phenomena this part of the task is simplified since there is a set standard with which to compare the simulation output. For the STAR SHIP it is a bit more challenging and certainly more rewarding.

<!-- page 111 -->

# Glossary

**COMMON DATA** That area of memory or that section of variables accessible to all portions of a program. Sometimes called global variables area.

**CONCURRENCY** When the simulation is running and a scenario is being used to define the tactical situations the scenario acts as a program running *concurrently* with, i.e. at the same time as, the simulation program.

**CRT—Cathode Ray Tube** Typically a television style display in which graphic (lines, circles, etc.) and alphanumeric characters (written text) can be displayed.

**FUNCTIONAL STATUS** A percentage indicating the ability of the associated device to function properly. 100% means it is perfectly functional. 0% indicates complete failure.

**INFINITY** The maximum value which can be represented on a particular computer software simulation.

**I/O PORT—Input/output port** Typically a memory location through which a computer can communicate with some external device such as a keyboard.

**NOTIFY OPERATOR** Giving the operator of the associated device (navigation console, helm console, etc.) a message either via the alert section of his display or by means of a vocal output device (obviously dependent upon the accessible hardware).

**OPERATIONAL STATUS** Whether a device is operating. Can be either ON/OFF (e.g. phaser) or a percentage level (e.g. shield screens).

**Real-time** Descriptive of a computer program which runs so fast that a human operator observes virtually no time delay between input of some data and the output of some related results.

<!-- page 112 -->

**RELATIONSHIPS, SIMULATION** Those relationships or functions which, during the system design, are unknown but which can be determined to some degree of accuracy or acceptability by exercising the simulation.

**RELIABILITY FACTOR** Numerical value indicating the reliability of the associated device. It is used to determine when the associated device will fail.

**SCENARIO** A set of statements which defines a specific tactical situation. Often implemented as a program which runs concurrently with another program and affects the values of certain variables within that program, thereby defining the environment in which the program runs.

**SENSOR RANGE** The distance within which the sensors on the Enterprise can detect other space craft or celestial bodies. The actual range should be determined by running the simulation to determine what is a realistic value.

**TBD** An abbreviation for To Be Determined. In this simulation it is used to specify those values and relationships which can only be determined by running the simulation, i.e. simulation relationships.

**X/Y** An angle used to specify the direction of the Enterprise, an enemy or Federation craft, or shuttlecraft. The angle is measured from the positive X-axis towards the positive Y-axis.

**X/Z** Similar to X/Y except that the angle is measured towards the positive Z-axis.

<!-- page 113 -->

# Index

- Attributes, 1
- Attributes, relationships, 1
- Basic, structuring in, 6
- Bridge, mock-up of, 116
- Cargo, enterprise, common data, 54
- Celestial common data, 45
- Commands, communications, 28
- Commands, engineering, 38
- Commands, helm, 42
- Commands, navigation, 32
- Commands, sciences, 35
- Commands, simulation controller, 25
- Comment, 18
- Common data, celestial, 45
- Common data, enemy ships, 54
- Common data, enterprise, 45
- Common data, enterprise cargo, 54
- Common data, enterprise communications, 52
- Common data, enterprise life support, 51
- Common data, enterprise medical, 49
- Common data, enterprise navigation, 49
- Common data, enterprise propulsion, 48
- Common data, enterprise security, 52, 53
- Common data, enterprise sensor, 53
- Common data, enterprise shuttlecraft, 50
- Common data, enterprise tractor beam, 51
- Common data, enterprise transporter, 51
- Common data, enterprise turbo-elevator, 51
- Common data, enterprise weapons, 48
- Common data, federation ships, 56
