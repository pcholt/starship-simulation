<!-- NOTE: The physical scan order of these files does not always match increasing printed
page numbers. Printed pages 16 and 17 appear swapped (pg-021.png carries printed page "17";
pg-022.png carries printed page "16"), and likewise printed pages 22 and 23 appear swapped
(pg-025.png carries printed page "23"; pg-026.png carries printed page "22"). Transcription
below follows strict file order (pg-016.png ... pg-030.png) per instructions, with each
section tagged by its PDF filename page number. The printed page number found in the running
header of each page is also noted for cross-reference. -->

<!-- page 16 -->

*(printed page 11 — unnumbered chapter-opening page)*

# 2 Program Structure

I present here a description of the program structuring methods that I have utilized in the STAR SHIP project. What I describe is a nondedicated, structured program logic definition tool. It is nondedicated in the sense that it is not associated with any particular programming language. It is a method of defining the logic flow of a program using a set of Englishlike grammatical constructions. Since the STAR SHIP system is written utilizing these constructions it will help to read through this chapter once and then refer back to it when reading through the STAR SHIP logic flow definitions in the next chapter.

Structured programming is a method of program development. It is not so much a language as it is a technique for utilizing whatever computer language you are working with. It aids the programmer in approaching his task in a logical, straightforward, break-it-apart-and-tackle-it-piece-by-piece manner.

This discussion relates more to the structured design of software and the use of comment statements employing the structured constructs than to the use of a particular language. This means that software should be designed, logically thought out, and completely written down in the form of structured comment statements before any actual code is written. After that has been done the executable code is added which implements the functional descriptions given in the structured comments. With this in mind, we can discuss the details of structured programming.

Structured programming allows the following types of constructions

<!-- page 17 -->

*(printed page 12)*

IF-ORIF-ELSE-ENDIF
REPEAT-UNTIL
WHILE-ENDWHILE
FOR-ENDFOR
DECLARATIVE
RETURN
COMMENT
STATEMENT SEQUENCE

Note particularly that there is no such thing as a GO TO or jump type statement. On the surface it might appear that you can't do without some form of GO TO statement. Consider the fact that it is theoretically possible to write any program in straight-line code with only one type of statement, the decision statement, which states *if such-and-such is true then do this*. Certainly such a program would be difficult to develop, might require a computer with infinite memory, and the decision conditions would get quite involved, but it is possible to develop any program using only the IF statement. Any other additions to the repertoire of instructions are simply embellishments to make it easy for the programmer. The constructions listed above are quite sufficient for any programming task. Now to the descriptions.

### IF-ORIF-ELSE-ENDIF

This is the decision-making construction and its general form is as follows:

```
IF (condition 1) :
 statement sequence 1 .
ORIF (condition 2) :
 statement sequence 2 .
ORIF (condition 3) :
 statement sequence 3 .
-----
-----
-----
ORIF (condition n) :
 statement sequence n .
ELSE (comment) :
 statement sequence for else condition .
ENDIF
```

<!-- page 18 -->

*(printed page 13)*

In this construct the first conditional statement is evaluated. If it evaluates to true, then statement sequence 1 is executed and the remainder of the IF construction is skipped i.e. control is passed to the statement following the ENDIF. (The term *statement sequence* will be fully defined later. It is sufficient now to consider it to be a set of statements to be executed.) If conditional statement 1 evaluates to false, then conditional statement 2 is evaluated. If it evaluates to true, then statement sequence 2 is executed and the remainder of the IF construction is skipped. If conditional statement 2 evaluates to false, then conditional statement 3 is evaluated, and so on.

In other words, the first conditional statement within the IF/ORIF/ELSE/ENDIF construction that evaluates to true causes its corresponding statement sequence to be executed and the remainder to be skipped. If none of the conditions evalute to a logical true, then the statement sequence following the ELSE is executed.

Note that any number of ORIFs are allowed, but only one ELSE, and the ELSE must be the last part of the construction before the ENDIF.

That is the general form of the IF. The ORIFs and their associated statement sequences are optional. Likewise, the ELSE and its associated statement sequence is optional. The comment on the ELSE line is also optional but is often included to make the program more readable. Notice, too, that the IF, ORIFs, ELSE, and ENDIF all start in the same character position (card column), and that the statement sequences are indented one character position. The other forms of the IF statement, then, are as follows:

### IF-ORIF-ENDIF

```
IF (condition 1) :
 statement sequence 1 .
ORIF (condition 2) :
 statement sequence 2 .
-----
-----
-----
ORIF (condition n) :
 statement sequence n .
ENDIF
```

<!-- page 19 -->

*(printed page 14)*

### IF-ELSE-ENDIF

```
IF (condition) :
 statement sequence .
ELSE (comment) :
 statement sequence for ELSE .
ENDIF
```

### IF-ENDIF

```
IF (condition) :
 statement sequence .
ENDIF
```

Perhaps a word about CONDITIONs is in order. A condition is a logical statement. That should be familiar to anyone who has used any sort of IF statement, no matter what the language used. It could be of the form IF (X.EQ.7) for those familiar with FORTRAN, or IF A<=B for those familiar with BASIC. Or it could be of a more functional Englishlike form such as IF SWITCH 6 WAS ACTIVATED. The structured programming constructions should tell not just what variables are being used but also the functional objectives of the code, i.e. what is being accomplished.

One last word about the IF-ORIF-ELSE-ENDIF. It is an ideal construction for the SELECT-CASE type of routine. Here is a simple example:

```
IF DIAL 1 WAS TURNED :
 THEN DO SO-AND-SO .
ORIF DIAL 2 WAS TURNED :
 THEN DO SUCH-AND-SUCH .
ORIF DIAL 3 WAS TURNED :
 THEN DO THIS-AND-THAT .
ORIF DIAL 4 WAS TURNED :
 THEN DO SUCH-AND-SO .
ELSE NO DIAL WAS TURNED :
 < SO THIS SUBROUTINE SHOULD NOT HAVE BEEN
 < CALLED.
 NOTIFY THE OPERATOR WITH A MESSAGE .
ENDIF
```

<!-- page 20 -->

*(printed page 15)*

In general, note that each IF and ORIF line is terminated with a colon (:). This is quite helpful in reading the program when a (condition) continues on to subsequent lines.

### REPEAT-UNTIL

This construction is used to repeat a section of code (statement sequence) until some specified condition is true. The general form is as follows

```
REPEAT
 statement sequence .
UNTIL (condition) :
```

Generally, a condition is set up to be logically false before the REPEAT-UNTIL is executed. Then the statement sequence is executed over and over again until that condition is logically true. Obviously there must be some statement within the statement sequence which sets the condition true or it will result in an endless loop. Here is an example which prints out the square of a number input by an operator. When the input number is equal to 999 the program stops.

```
REPEAT
 GET NUMBER FROM THE OPERATOR ;
 IF THE NUMBER IS NOT 999 :
  PRINT OUT THE SQUARE OF THE NUMBER .
 ENDIF
UNTIL THE NUMBER INPUT BY THE OPERATOR IS 999 :
```

In the above example the statement sequence which is repeatedly executed is all of the statements between the REPEAT and the UNTIL. Note that the statement sequence may contain subsequent structured programming constructions, in this case the simple IF-ENDIF.

It is important to note that the statement sequence within a REPEAT-UNTIL will always be executed at least once regardless of the evaluation of the condition. This is because the evaluation is done after the first execution of the statement sequence.

<!-- page 21 -->

*(printed page 17 — note: this page's printed number is out of sequence; it follows printed page 15 and precedes printed page 16 in the scan order)*

```
FOR I = 1 TO 10 :
 statement sequence .
ENDFOR
```

Note that the step is optional and when not specified is assumed to be 1.

### DECLARATIVE

A declarative is any statement which specifies some operation (other than decision or looping) to be executed. Sample declaratives would be as follows:

```
PRINT THE VALUE OF X ;
DISPLAY THE CURVE ON THE DISPLAY ;
X=A+B*SIN(R)/LOG(D-C) ;
CALL THE INPUT ROUTINE ;
INCREMENT THE VALUE OF W BY 1 ;
```

In particular, note that each declarative is terminated by a semi-colon (;), just as a colon (:) is used to terminate conditions in the IF, ORIF, FOR, UNTIL, and WHILE constructions. This becomes helpful when the declarative continues on to more than one line (card). Also notice that calls to subroutines are specified in declarative statements.

The use of the word *DECLARATIVE* is in the English grammar sense of a command to do something. It applies equally well to both data specification statements and to executable statements.

### RETURN

The RETURN statement is used at the end of a subroutine to denote, quite obviously, its end. The general (and only) form is:

```
RETURN//
```

The double slash is included as part of the return statement simply to make it easily recognizable in a program.

<!-- page 22 -->

*(printed page 16 — note: this page's printed number is out of sequence; see note on page 21 above)*

### WHILE-ENDWHILE

This construction is very similar to the REPEAT-UNTIL except that the test as to whether to execute the statement sequence is done before its execution. This means that although in the REPEAT-UNTIL case the statement sequence is always done at least once (since the test is not done until after the first execution), in the WHILE-ENDWHILE case the statement sequence might not be done at all, depending upon the first evaluation of the condition. Also note that the statement sequence is executed as long as the condition is **true** which is the opposite of the REPEAT-UNTIL which executes its statement sequence as long as the condition is false. The general form is as follows:

```
WHILE (condition) :
 statement sequence .
ENDWHILE
```

As with the REPEAT-UNTIL care must be taken to avoid endless loops caused by the condition never evaluating to false.

### FOR-ENDFOR

This construction is very similar to the FOR statement in BASIC or the DO statement in FORTRAN. It is used when a section of a program is to be repeated a certain number of times and always at least once. Its general form is as follows:

```
FOR i = n TO m STEP j :
 statement sequence .
ENDFOR
```

As in most constructions of this type the *i* is the index variable, *n* is the initial value assigned to the index variable, *m* is the final test value which is used to determine when the statement sequence should stop being executed, and *j* is the increment to be added to the variable after each execution of the statement sequence.

For example, to execute some sequence of statements exactly ten times, the following could be done:

<!-- page 23 -->

*(printed page 20 — page is blank except for the running header "20  The Complete STAR SHIP: A Simulation Project", scanned in landscape/rotated orientation)*

<!-- page 23: blank -->

<!-- page 24 -->

*(printed page 21 — unnumbered chapter-opening page)*

# 3 The Star Ship Simulation Project

In the original published version of this STAR SHIP simulation program which appeared in the August, September, and October 1977 issues of *Interface Age* magazine, I stated that "while this description is extensive it is not exhaustive." That situation is now changed. The version presented in this chapter leaves little left to be done, short of actually implementing it for a particular hardware/software setup. Details are given for every major function aboard a star ship as well as the intelligence of enemy and friendly space craft, and celestial objects. What follows, then, is an example of the principles discussed in the previous two chapters.

### SYSTEM OBJECTIVE

A. To develop a software system which completely simulates the hardware associated with the navigation, communications, helm, medical, engineering, and sciences functions of a Constitution class Starship as defined on the television program STAR TREK and in the documents *Star Fleet Technical Manual* and *Star Trek Blueprints*, both published by Franz Joseph Designs, 1975.[\*]

B. To simulate the actions (intelligence and tactical maneuvers) of a number of enemy and Federation space craft within a simulated three-dimensional universe.

C. To develop the software in a flexible manner so that it may be implemented either for a multi-operator mode in which

---

[\*] These books are available at bookstores, nationwide.

<!-- page 25 -->

*(printed page 23 — note: this page's printed number is out of sequence; it follows printed page 21 and precedes printed page 22 in the scan order)*

The scenario, as mentioned above, and its associated module, the SIMULATION CONTROLLER, make it possible for a given sequence of events to be run more than once, allowing the operators to try different methods of handling the given tactical situations. This is different from the average STAR TREK computer game which has no well-defined sequence of events. They are usually controlled by operator actions and certain pseudo-random variables. In the simulation, on the other hand, the simulation controller has access to all of the variables throughout all of the modules and thus controls the tactical situations presented to the operators.

In its simplest form (and the form in which it is used in this simulation) a scenario is a set of events and the times at which they are to occur. A sample scenario is shown in figure 3.1.

This scenario is, in effect, a set of instructions to load certain values into the variables in the common data area. It may be thought of as a program, prepared offline, that runs concurrently (or parallel) with the simulation. For instance, to cause damage to the life support system on the Enterprise the scenario might specify to change the variable called FB from whatever its current status is to zero, indicating severe damage. The module which monitors the variable, in this case the Engineering module, would soon recognize the change in status and report it, via an appropriate display, to the operator.

The scenario is considered to be input to the SIMULATION CONTROLLER. The actual form of the scenario might be a paper tape, a cassette, a magtape, diskette, or other type of storage which can be read in during the execution of the simulation. The specific hardware/software installation will determine the form and whether it is read one line (record) at a time or all at once. The function of the SIMULATION CONTROLLER is to execute the commands in the scenario at the appropriate times. This eliminates the need to write an entirely new simulation each time a different tactical situation is to be presented to the operators. The scenario, then, actually defines the mission of the Enterprise. By writing an appropriate scenario just about any of the tactical situations presented on the STAR TREK television program may be simulated. Indeed, the only limit to the kinds of missions that this system can simulate is the user's imagination.

An expanded implementation might allow conditional statements within the scenario providing greater control over the

<!-- page 26 -->

*(printed page 22 — note: this page's printed number is out of sequence; see note on page 25 above)*

several people operate the system with each one assuming the role of a particular officer on the bridge including captain, navigator, communications officer, engineer, etc. and each one having his own display and input terminal, or for a single operator-single terminal implementation.

D. To provide a simple means by which specific tactical situations may be defined both dynamically during the running of the simulation or offline for future recall.

### MAJOR FUNCTION IDENTIFICATION

The major functions for this simulation are as follows:

1. Simulation controller
2. Communications
3. Navigation
4. Sciences
5. Engineering
6. Medical
7. Helm

Each of these major functions comprise one main module of the system.

### MAJOR FUNCTIONS OBJECTIVES

#### Simulation Controller

The simulation controller function is the module which controls the operation of all of the remaining modules. During the running of the simulation there is one person who has the role of controller. This is not an Enterprise officer position and has no counterpart on the television show STAR TREK except, perhaps, in the role of director or producer. The controller dictates what will happen during the running of the simulation. He has complete control over all of the variables which reside in common memory (to be described later). He can create enemy and Federation craft, as well as celestial objects. He specifies the task of the Enterprise. He can cause malfunctions to any of the ship's hardware such as computers, life-support systems, warp engines, and so on. He has the ability to set into action a predefined set of events (a scenario) for the officers. In effect, the controller runs the show.

<!-- page 27 -->

*(printed page 24)*

*Figure 3.1 SAMPLE SCENARIO — a table listing TIME, STATEMENT, and COMMENT columns, showing a chronological sequence of scenario commands loaded into common-data variables. Caption below the table: "The scenario defines the tactical situations presented to the operators. It is a dynamic type of definition and is, in effect, a program which runs concurrently with the simulation, creating enemy and Federation space craft, causing time-warps or system malfunctions, inflicting damage to planetary civilizations, and so on."*

| TIME | STATEMENT | COMMENT |
|---|---|---|
| 0000 | CV=2001 | SET DESTINATION OF THE ENTERPRISE TO ENEMY CRAFT NUMBER 1 |
| 0010 | HW(1)=1 | SET MISSION OF ENEMY CRAFT NUMBER 1 TO UNCONDITIONAL ATTACK |
| 0025 | B7(2)=32 | SET RELIABILITY OF THE ENTERPRISE'S PHASER STATION NUMBER 2 TO POOR |
| 0030 | HO(1)=4000 | SET THE DESTINATION OF ENEMY CRAFT 1 TO THE ENTERPRISE |
| 0032 | DP(3)=4 | MAKE SHUTTLECRAFT NUMBER 3 SEEK THE ENTERPRISE SHUTTLE BAY |
| 0100 | F2=45763 | SET THE ENTERPRISE TOTAL ENERGY SUPPLY |
| 0103 | AH(2)=2 | MAKE CELESTIAL OBJECT NUMBER 2 INTO A BLACK HOLE |
| 0123 | CH=0 | MAKE THE SPACE/WARP ENGINES INOPERATIVE (SHOULD REDUCE THE ENTERPRISE'S ABILITY TO OUTRUN AN ENEMY CRAFT) |
| 0245 | DC=100 | SET THE PATIENT CAPACITY OF THE MEDICAL SECTION |
| 0256 | EO=65 | SET THE ENERGY REQUIREMENT OF THE TRANSPORTER (THIS WILL CAUSE IT TO USE UP MORE ENERGY EACH TIME IT IS USED) |
| 0270 | BS(42)=3 | SEND PERSONNEL NUMBER 42 TO THE BRIG |
| 0301 | EV=52 | SET THE FOOD NUTRITION LEVEL TO POOR (THIS WILL CAUSE ILLNESS TO SOME OF THE CREW) |

<!-- page 28 -->

*(printed page 25)*

*Figure 3.2 SIMULATION CONTROLLER COMMANDS — a two-column table of FUNCTION and COMMAND FORMAT for the simulation controller command language. Underlined letters in the FUNCTION column indicate the letter used in the COMMAND FORMAT (e.g. "Initialize" → I, "All" → A).*

| FUNCTION | COMMAND FORMAT |
|---|---|
| Initialize All modules | I A |
| Initialize Engineering module | I E |
| Initialize Communications module | I C |
| Initialize Navigation module | I N |
| Initialize Sciences module | I S |
| Initialize Medical module | I M |
| Initialize Helm module | I H |
| Execute All modules | E A |
| Execute Communications module | E C |
| Execute Navigation module | E N |
| Execute Sciences module | E S |
| Execute Medical module | E M |
| Execute Helm module | E H |
| Halt All modules | H A |
| Halt Engineering module | H E |
| Halt Communications module | H C |
| Halt Navigation module | H N |
| Halt Sciences module | H S |
| Halt Medical module | H M |
| Halt Helm module | H H |
| Display Module variables | D M module name |
| Display Variable | D V variable name |
| Assign Value to variable | A V value, variable name |
| Create Enemy | C E enemy name, mission, x, y, z |
| Create Federation craft | C F craft name, mission, x, y, z |
| Create Celestial object | C C object name, x, y, z, radius, mass, radiation type |
| Input a scenario | I |
| Run the scenario | R |
| Halt the scenario | H |

<!-- page 29 -->

*(printed page 26)*

events and situations. Since the STAR SHIP simulation is completely modularized, adding this feature should be quite easy.

Besides providing the ability to run scenarios the simulation controller is a powerful debugging device. It allows the operator to initialize and run specific modules of the system and to watch the changing values of the common data variables as the modules are being executed. It also allows each module to be initialized to some predefined state.

A suggested set of simulation controller commands are given in figure 3.2. The actual format for the commands will, of course, depend upon the specific software implementations. The conventions established here, however, should serve as a good example.

#### Communications

The communications module is responsible for maintaining the status of intra-ship as well as inter-space communications and the location of personnel. It receives and displays messages coming from the various stations throughout the ship and from other craft and planets. It also enables the Enterprise to send and receive messages (e.g., distress calls) and initiate the transfer of personnel and cargo from one place to another.

This last function is of particular importance since it is through the communications officer that maintenance personnel are sent to repair damaged hardware, medical personnel are dispatched to the intensive care unit, search parties are sent to the shuttlecraft, food supplies are sent to planetary civilizations, and so on.

The valid communications commands are shown in figure 3.4.

When a person or cargo is given a destination figure 3.6 is consulted. If the destination is within the same turbo/elevator service area as the person's or cargo's current location, then the time required to effect the transfer is one minute and will be handled completely by the communications module.

If the destination is in a turbo/elevator service area different from the person's or cargo's current location then the person or cargo will be placed at the turbo/elevator station of the service area in which the cargo or person currently resides. This is done by the communications module. The engineering module then takes over by sending the person or cargo, via the turbo/elevator system, to the T/E station which services the area for the person's or cargo's destination.

<!-- page 30 -->

*(printed page 27)*

*Figure 3.3 SIMULATION CONTROLLER DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen-mockup diagram (scanned in landscape orientation) showing the layout of the simulation controller's display screen. It consists of a top strip and a grid of four repeated VARIABLE NAME / VALUE column pairs, with a row of three boxes below.*

- Top field: "NAME OF MODULE WHOSE VARIABLES ARE BEING DISPLAYED: ________________________________"
- Grid of four column-pairs (each blank, ready to be filled in), each pair labeled:
  - VARIABLE NAME | VALUE
  - VARIABLE NAME | VALUE
  - VARIABLE NAME | VALUE
  - VARIABLE NAME | VALUE
- Bottom row of three boxes:
  - ALERTS (blank box)
  - SCENARIO IS / [IS NOT] / RUNNING (with "IS NOT" boxed, suggesting a toggled/selectable state)
  - COMMAND: (blank box)
