<!-- page 1: blank -->

<!-- page 2 -->

# Preface

Simulation: The representation of physical systems and phenomena by computers, models, or other equipment; e.g. an imitative type of data processing in which an automatic computer is used as a model of some entity, e.g. a chemical process. When information enters the computer to represent the factors of a process, the computer produces information that represents the results of the process, and the processing done by the computer represents the process itself. [\*]

Simulation is probably one of the most fascinating fields within the computer sciences. Being able to fly a lunar module to the moon or detonate nuclear warheads to determine the fallout patterns over some specific area of the Earth without any of the dangers inherent in actual tests can be a very exciting and rewarding experience.

An associate of mine had the privilege of working on a fighter-bomber simulation in which two fully-equipped cockpits were mounted on a dynamic test bed allowing them to be tilted and vibrated in order to simulate the actual yaw, pitch, roll, and G-forces of a real aircraft. From within the cockpit the pilot was presented with a computer-controlled 360-degree field of view. The computer could present the pilot with just about any tactical situation, from landing under emergency conditions to dog-fights with the pilot in the other simulator.

A simulation need not be an extensive piece of hardware, however, and software is often a major portion of the total system. What I describe in this book are the methods used in de-

---

[\*] Microcomputer Dictionary and Guide, by Charles J. Sippl; 1976; Champaign, Illinois; Matrix Publishers, Inc.

<!-- page 3 -->

# Contents

Preface

Chapter 1  DESIGN.................................1
&nbsp;&nbsp;Designing a Simulation..............................2
&nbsp;&nbsp;&nbsp;&nbsp;Define the Overall Objective.......................3
&nbsp;&nbsp;&nbsp;&nbsp;Identify the Major Functions.......................3
&nbsp;&nbsp;&nbsp;&nbsp;Define the Objectives of Each of the Major Functions....4
&nbsp;&nbsp;&nbsp;&nbsp;Define the Interface Between the Major Functions.......4
&nbsp;&nbsp;&nbsp;&nbsp;Define the Logic Flow.............................5
&nbsp;&nbsp;&nbsp;&nbsp;Code the Logic Flow...............................5
&nbsp;&nbsp;&nbsp;&nbsp;Implement and Test the Logic Flow...................8

Chapter 2  PROGRAM STRUCTURE.....................11
&nbsp;&nbsp;IF-ORIF-ELSE-ENDIF..................................12
&nbsp;&nbsp;REPEAT-UNTIL........................................15
&nbsp;&nbsp;WHILE-ENDWHILE......................................16
&nbsp;&nbsp;FOR-ENDFOR..........................................16
&nbsp;&nbsp;DECLARATIVE.........................................17
&nbsp;&nbsp;RETURN..............................................17
&nbsp;&nbsp;COMMENT.............................................18
&nbsp;&nbsp;STATEMENT SEQUENCE..................................18
&nbsp;&nbsp;General Rules of Structured Programming.............18

Chapter 3  THE STAR SHIP SIMULATION PROJECT.......21
&nbsp;&nbsp;System Objective....................................21
&nbsp;&nbsp;Major Function Identification.......................22
&nbsp;&nbsp;Major Functions Objectives..........................22
&nbsp;&nbsp;&nbsp;&nbsp;Simulation Controller..............................22
&nbsp;&nbsp;&nbsp;&nbsp;Communications.....................................26
&nbsp;&nbsp;&nbsp;&nbsp;Navigation.........................................31
&nbsp;&nbsp;&nbsp;&nbsp;Sciences...........................................32
&nbsp;&nbsp;&nbsp;&nbsp;Engineering........................................35
&nbsp;&nbsp;&nbsp;&nbsp;Medical............................................38
&nbsp;&nbsp;&nbsp;&nbsp;Helm...............................................41

<!-- page 4 -->

## viii  The Complete STAR SHIP: A Simulation Project

signing and implementing a software simulation. By doing this simulation you will become familiar with the techniques by which any large programming task may be implemented. While some programmers may be content with simple programming and game playing, there are many who have greater ambitions. What the reader can learn from this book is how to attack a program which at the surface appears insurmountable but when approached in a straightforward, structured manner can be quite easily implemented. For those readers who have acquired this book strictly for the STAR SHIP simulation, which I use as an example, and who don't care to understand or already have a working knowledge of system design, by all means skip to chapter 3. On the other hand, if you want to see what went into the development of the example, and make it vastly easier to implement and modify the STAR SHIP to suit your own needs, then read on.

<!-- page 5 -->

## x  The Complete STAR SHIP: A Simulation Project

Major Functions Interface............................42
&nbsp;&nbsp;Common Data Area....................................45
&nbsp;&nbsp;&nbsp;&nbsp;Celestial Data.....................................45
&nbsp;&nbsp;&nbsp;&nbsp;Data Associated with the Enterprise................46
&nbsp;&nbsp;&nbsp;&nbsp;Data Associated with Enemy Craft...................54
&nbsp;&nbsp;&nbsp;&nbsp;Data Associated with Federation Craft..............56
&nbsp;&nbsp;&nbsp;&nbsp;General Data.......................................58
Logic Flow Definitions...............................60
&nbsp;&nbsp;Simulation Controller................................60
&nbsp;&nbsp;Communications.......................................66
&nbsp;&nbsp;Navigation...........................................75
&nbsp;&nbsp;Sciences.............................................90
&nbsp;&nbsp;Engineering..........................................93
&nbsp;&nbsp;Medical..............................................99
&nbsp;&nbsp;Helm.................................................101
&nbsp;&nbsp;General Notes........................................106
Logic Flow Code......................................106
Test Procedures......................................107

Chapter 4  IMPLEMENTATION...........................109
&nbsp;&nbsp;Single-Operator Mode.................................109
&nbsp;&nbsp;Multi-Operator Mode..................................110
&nbsp;&nbsp;Hardware.............................................110
&nbsp;&nbsp;&nbsp;&nbsp;Single-Processor Single-Console.....................110
&nbsp;&nbsp;&nbsp;&nbsp;Single-Processor Multi-Console......................111
&nbsp;&nbsp;&nbsp;&nbsp;Multi-Processor Single-Console......................112
&nbsp;&nbsp;&nbsp;&nbsp;Multi-Processor Multi-Console.......................113
&nbsp;&nbsp;&nbsp;&nbsp;Switches and Dials..................................113
&nbsp;&nbsp;Software.............................................116
&nbsp;&nbsp;&nbsp;&nbsp;High-Level Languages................................116
&nbsp;&nbsp;&nbsp;&nbsp;Low-Level Languages.................................117
&nbsp;&nbsp;&nbsp;&nbsp;Fitting It All In....................................118
&nbsp;&nbsp;&nbsp;&nbsp;Expansion and the Future............................119

Glossary.................................................121

Index....................................................123

<!-- page 6 -->

# 1  Design

The most important question to answer is 'How do you actually simulate something?' There are two steps. First you must determine the attributes (or characteristics) which sufficiently define the object or phenomenon which you are simulating. This means describing it to its fullest extent. The second step is to define the relationships of these attributes to themselves and to the environment.

For example, we can choose a star, our Sun, and describe it. It is located at a particular point in space, it is 2.7 million kilometers across, it has a mass of 2\*10↑33 grams, it is travelling at 32 kilometers-per-second towards Antares, and it gives off radiation. We now choose attributes which delimit these observations. We call its particular point in space its location, its speed and direction is its velocity vector, its weight we call mass, and so on. Then we can accurately describe any particular star simply by defining the values of these attributes.

The second step is to define the relationships of these attributes with themselves and with the attributes of the other objects and phenomena in the simulation. For the star these would include physical relationships such as F = M\*A, the inverse square law of radiation, etc., and simulation relationships such as what happens when the star is hit by another star or when the radiated energy is depleted. I define *simulation relationships* to mean those relationships which are unknown but which can be determined to some degree of accuracy by the running of the simulation.

This can be a difficult part of the simulation process. In some cases where we do not know the relationships we will have to make (hopefully educated) guesses. In a task such as the STAR

<!-- page 7 -->

## 2  The Complete STAR SHIP: A Simulation Project

SHIP simulation (to be described fully in subsequent chapters) many of the relationships are simply fiction and therefore up to the programmer's imagination. Does anyone really know what happens when a photon torpedo hits a star?

In other simulations we try to accurately represent physical phenomena. When we are uncertain or have no basis for a representation we make a guess. After we implement the guess and run the simulation we might be able to judge whether the results are reasonable, and, if not, to change the approach to the problem. In this way a simulation can help us try out several approaches to a given problem without actually having to do the physical experiments.

To be sure, this is the purpose of most industrial applications of computer simulations. When Walt Disney Productions was planning their monorail system they first designed a computer program that simulated the arrivals and departures of the individual cars, the number of anticipated passengers, the locations of the loading ramps, and so on. By running the program the engineers could determine whether their hardware designs were sufficient and make appropriate modifications.

### DESIGNING A SIMULATION

A simulation program, as with any piece of software, should be well thought out and designed in a step-by-step, straightforward manner. This should not be thought of as imposing restrictions upon the programmer. Quite the contrary. It frees the programmer to concentrate more on the details of the program and logic and worry less about producing a program so intertwined and complex as to be confusing, unmanageable, and at best, impossible to debug.

The steps in producing any piece of software are the same whether it be for a small program to generate random numbers or an extensive simulation system. They are:

1. Define the overall objective.
2. Identify the major functions.
3. Define the objectives of each of the major functions.
4. Define the interface between the major functions.
5. Define the logic flow.
6. Code the logic flow.
7. Implement and test the logic flow.

<!-- page 8 -->

## DESIGN  3

While these constitute the major steps in producing software they are not necessarily to be thought of as discrete steps. Although the general flow of work is from top to bottom (from number 1 to number 7) there is quite often an overlapping of progress. Parts 1 through 4 would probably be done together since the definitions required often expect the predefinition of some other part. It is a recursive type of work where one part is tentatively defined, some other part is defined based on the first, and then the first is redefined based on the further understanding of the second part. It means simply that the project must be viewed as a whole and that understanding must be established for all of the parts working together as well as each part working individually. The more time that is spent on preparation, the less time will be needed for debugging later on.

### Define the Overall Objective

It should be obvious that an overall objective must be clearly understood before undertaking any task, yet all too often this step is overlooked. Many programmers begin with coding (writing the program), having only a vague idea of what the program is supposed to do. It is a sort of trial and error method in which much time is spent in needless testing, code-writing, and subsequent rewriting. Having a clearly specified objective is therefore of utmost importance.

### Identify the Major Functions

A *major function* can be thought of as "a portion or section of the entire system which accomplishes some predefined goal and which is logically distinct from the other functions." For example, in a chess playing program there might be several main functions including displaying the game board, accepting player moves, piece evaluation, and so on.

The next task is to define the major functions for the simulation. Defining these functions can be done in several ways. A large programming task may employ several software and hardware specialists so that a joint effort by all, probably in a common meeting, might be required to talk over the objectives. Each member may have expertise in a particular phase of the project or have been assigned to research some aspect. In the

<!-- page 9 -->

## 5  DESIGN

A simple method of transferring information is through an area of resident (or offline) memory specified as a COMMON area. This means that all modules have access to it. Each module monitors the variables in common and when a change which is significant to a particular module occurs it (the module) takes the appropriate action. If the programming language being used is BASIC then the problem is simple since all variables are accessible to every portion of the program, subroutines included. When using FORTRAN the programmer must explicitly put them into a common area. This is easily done with the COMMON statement. Every language has some means by which all modules may have access to a common data area.

Defining the interface not only means defining the method of interchange but also explicitly naming the variables which will reside in the common area and stating their meanings. One suggested method is to compile a list of the variables, their names, their meanings, and their range of values, grouped logically. They might also be included in a chart showing which modules can read the variable values and which modules can alter (or write) values into the variables.

### Define the Logic Flow

It is always advisable to design the logic flow in a structured manner. Without a defined structure there is a tendency to write code concurrent with the development of the logic. This all too often leads to poor coding practices such as employing *tricks*, losing track of the logic flow, and unmanageable code. I always suggest that a program first be written using only comment statements (REMARK statements in BASIC). There should be no actual code included, yet the entire program should be defined. That is the important point. There should be a complete definition of the program before any code is written. Working this way eliminates much of the debugging and subsequent rewriting.

The next chapter presents one form of structuring a program.

### Code the Logic Flow

At some point early in the design of a program the decision should be made as to which programming language is to be used for implementation. Knowing the instruction repertoire that will

<!-- page 10 -->

## 4  The Complete STAR SHIP: A Simulation Project

joint meeting each one can express his ideas and then defend them as the others pick them apart to find flaws.

Most programmers, however, particularly hobbyists and personal computer users, will not have access to a software team and must rely upon their own resources and ingenuity. But that should not stop them from taking on a large task. They should simply partition the task into workable pieces so that when it comes to the point of defining the logic flow the functions can be tackled one at a time. The STAR SHIP simulation was that type of project with the roles of system designer, programmer, etc. all done by the author. It is by dividing the project into workable pieces (functions) that allows one person to take on such a task.

### Define the Objectives of Each of the Major Functions

This portion of the system design is closely related to the previous one. Obviously when attempting to identify the major functions you must have a good idea of the objectives of each. This part simply helps to further clarify the task by writing down exactly what you want to accomplish.

This may involve subdividing the major functions into smaller subfunctions. A piece-position evaluation function for a chess-playing program may contain subfunctions to evaluate starting positions, middle-game positions, and ending-game positions.

The definition of the function need not be restricted to strictly software. If, for example, CRT type displays are involved in the task, then preliminary display formats might be drawn up at this stage. The main objective here is to section the task into logical, workable pieces so that each one can be handled individually and the programmer does not have to keep track of the entire system at one time. In the STAR SHIP project I generally use *module* interchangeably with *function*. A module is easily thought of as a subroutine and, indeed, is often implemented as such. Just as a computer may be made up of several hardware modules, e.g. the CPU board, memory modules, I/O modules, so software is made up of functional modules.

### Define the Interface Between the Major Functions

An interface must be defined between the several major modules. The interface is the method by which the modules exchange information.

<!-- page 11 -->

## DESIGN  6

be available often has an effect on the way the logic flow is developed. For most hobbyists the choices are limited to BASIC and the assembly language of their computer, but for others the choices may be quite varied. Certainly you will want to choose the one that will make your task easiest.

There are many tradeoffs to be considered. If speed of execution is of utmost importance, then an assembly language such as 6502 ASM would be best. But the coding will probably take longer and generally be more tedious. If ease of programming is important then a high-level language such as BASIC or FORTRAN might be a good choice, understanding that it may run slower than its assembly language counterpart. The evaluation of the tradeoffs and their respective importance is up to the programmer.

When the logic has been thoroughly defined the actual code (of the selected language) can be written. It is the programmer's job to develop the code that executes the functions of each structured programming construct. This is quite simple for most languages. As an example, look at the BASIC program of figure 1.1. (Double quotes signify the beginning of the comment field, allowed in some versions of BASIC.)

```
10  IF C<>0 THEN GOTO 40          "IF CODE = 0 :
20  F1=1                          "SET INITIALIZATION FLAG .
30  GOTO 100
40  IF C<>1 THEN GOTO 80          "ORIF CODE = 1 :
50  F1=0                          "CLEAR INITIALIZATION FLAG .
60  GO TO 100
70  REM                          "ELSE CODE IS BAD :
80  PRINT 'BAD CODE'             "SO NOTIFY OPERATOR .
90  REM                          "ENDIF
100 GOSUB 1000                   "GET INPUT FROM OPERATOR ;
110 REM                          "< PRINT SQUARES OF 1 TO 10
120 FOR I = 1 TO 10               "FOR I = 1 TO 10
130 PRINT I↑2                     "PRINT SQUARE OF I .
140 NEXT I                        "ENDFOR
```

**Figure 1.1  Example of Implementing Structured Code in BASIC**

*The comments, signified by double quotes, are written first. The actual executable code is then added which implements the functions described in the structured programming comment statements and are written parallel to them.*

The structured comments make it clear what the executable statements are accomplishing. Without them, understanding the function of any section of code becomes a task in itself, and a

<!-- page 12 -->

## DESIGN  7

programmer wants to program, not to be an interpreter of confusing code.

Some programmers are fortunate to have access to a piece of software called a *structured programming preprocessor*. It allows the programmer to write source code using structured constructs not normally allowed in a particular language. The source code is then used as input to the preprocessor which interprets it and produces as output a new source-code listing with each of the structured constructs converted into its corresponding code in the selected language. Figures 1.2 and 1.3 serve as an example of a FORTRAN program before and after preprocessing (FORTRAN normally does not allow structured constructs).

While the code after preprocessing looks quite involved the programmer never needs to look at it. He can work directly from the original (Figure 1.2) for all of his implementation and debugging. The processed code is simply used as the input to the compiler.

```
        FOR I = 1 , 10
        WRITE (1,10)A
   10   FORMAT('HELLO THERE')
        ENDFOR
        X=0
        REPEAT
        X=X+.1
        UNTIL (X.EQ.1)
        Q=100
        WHILE (Q.GT.7)
        Q=Q-.3
        ENDWHILE
        IF (CODE.EQ.1)
        P=7
        ORIF (CODE.EQ.2)
        H=98
        ORIF (CODE.EQ.3)
        J=4
        ELSE
        K=0
        ENDIF
        END
```

**Figure 1.2  FORTRAN Example: Before Preprocessing**

*Actual structured programming constructs are allowed within the instructions.*

<!-- page 13 -->

## 8  The Complete STAR SHIP: A Simulation Project

```
        DO 99999 I = 1 , 10
        WRITE (1,10)A
   10   FORMAT('HELLO THERE')
99999   CONTINUE
        X=0
99998   CONTINUE
        X=X+.1
        IF(.NOT.(X.EQ.1)) GOTO 99998
        Q=100
        GOTO 99997
99996   CONTINUE
        Q=Q-.3
99997   CONTINUE
        IF(Q.GT.7) GOTO 99996
        IF(.NOT.(CODE.EQ.1)) GOTO 99995
        P=7
        GOTO 99994
99995   CONTINUE
        IF(.NOT.(CODE.EQ.2)) GOTO 99993
        H=98
        GOTO 99994
99993   CONTINUE
        IF(.NOT.(CODE.EQ.3)) GOTO 99992
        J=4
        GOTO 99994
99992   CONTINUE
        K=0
99994   CONTINUE
        END
```

**Figure 1.3  FORTRAN Example After Preprocessing**

*The structured programming conventions have been replaced by comparable FORTRAN expressions. This is the source used as the input to the compiler.*

### Implement and Test the Logic Flow

All too often the only test procedure followed is *run it until it fails, then debug*. The more advisable method is to plan a set of test procedures while the software is being developed (steps 1 to 5), when you know exactly what each section of the code should produce. This may include such things as a sample input

<!-- page 14 -->

## DESIGN  9

with known results (best used in numerically processed data) or a scenario in the case of a simulator.

Including trace functions in the code is a very good practice, too. A trace function is one or more lines of code that print out the values of critical variables at certain points during the execution of the program. It may include messages such as "GOT TO THE FIRST SUBROUTINE OK WITH K = 7" to let the operator follow the logic flow during the run. When an unexpected value or message turns up or the logic flow doesn't follow the expected path the programmer will know exactly where in the program to look for the error. After all of the problems are resolved the trace functions are removed for the final program version.

Some programming systems include a built-in trace function which usually prints out more information than is really necessary. I suggest that the program developer utilize his own tracing methods rather than try to wade through the massive printouts produced by the standard trace functions. He can include only what is sufficient to test his program and not have to cope with so many extraneous trace outputs.

<!-- page 15: blank (page number "10" and running header only; no body text) -->
