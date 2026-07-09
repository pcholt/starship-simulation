<!-- page 46 -->

means that it looks to see if the target is fore, aft, above, below, port, or starboard in relation to the Enterprise. Then it checks to see whether the corresponding phaser bank is operational. If not, then the helmsman gets notified. If it is, then the weapon is fired and the appropriate damage (based on distance to the target, status of the target's deflector shields, etc.) is registered to the target.

What this means is that the phasers have limited direction capability and if only the forward banks are functioning it will not be possible to fire at a target following the Enterprise. The Enterprise would first have to turn completely around.

The photon torpedo, on the other hand, will track a target. That is, it may be fired from any of the six torpedo tubes, will *look for* the target, and will zero in on it even if the target changes course. It (the torpedo) is intelligent enough to know not to hit the Enterprise.

For both the phasers and the photon torpedos the specified target must be within sensor range and not have a cloaking device in operation. Otherwise the weapon will not fire.

Note that there is a limited number of torpedos. However, delivery may be received from another Federation craft or by docking with a star base.

There are six deflector shields on the Enterprise, one each for fore, aft, top, bottom, port, and starboard, and their operational levels may be individually set.

| FUNCTION | COMMAND FORMAT |
|---|---|
| Fire Phaser at named Object | F P O object name |
| Fire Phaser at Coordinates | F P C x, y, z |
| Fire photon Torpedo at named Object | F T O object name |
| Fire photon Torpedo at Coordinates | F T C x, y, z |
| Set Deflector shield level | S D shield location, level |

**Figure 3.16 HELM COMMANDS**

## MAJOR FUNCTIONS INTERFACE

Each module in this simulation has access to a common data area. It is assumed that all modules reside in main memory and are executed sequentially under control of the Simulation Con-

<!-- page 47 -->

troller although other methods are possible and discussed in the chapter on implementation. A portion of main memory is reserved as a common data area and all modules have read/write access to it. What follows is a list of the variables in this common data area and a description of how to read the table.

Text enclosed in angle brackets (<) define the major classification of the variables that follow. Text followed by a colon (:) indicates a subclassification. Each actual variable is preceeded by a two-character variable name. Data identifications followed by a set of parentheses () indicate an array variable. A number within the parentheses specifies the dimension of the array. Where no number appears within the parentheses the array size is unspecified (or random) indicating that the actual dimension is determined by the programmer or imposed by the limits of the computer memory. Commas within parentheses indicate additional dimensions (e.g. (,) means a two dimensional array with each dimension unspecified). Text preceeded by a square bracket ([) denotes information about the variable such as the numerical range or units.

For example, under ENTERPRISE COMMUNICATIONS DATA the line MESSAGE STACK(10,100) indicates an array with ten messages of one hundred characters each. The SHUTTLECRAFT PROPULSION TUBES RELIABILITY FACTOR (6,2) is a two dimensioned array. Each of the six shuttlecraft has two propulsion tubes. So DT(1,1) holds the reliability factor of tube number one on shuttlecraft number one, DT(1,2) holds the reliability factor of tube two craft one, etc.

In some cases the subscripts are given as variable names. Under CELESTIAL DATA the number of celestial objects is given as the variable named AG. Subsequently, the CLASSIFICATION has a subscript of AG. This indicates that the dimension of the classification variable is the same as the number of celestial objects, and that classification(1) is for object number 1, CLASSIFICATION(2) is for object 2, and so on.

<!-- page 48 -->

## COMMON DATA AREA

### <CELESTIAL DATA>

UNIVERSE SIZE

| Code | Variable Name | Value Range/Units |
|---|---|---|
| AA | X-MAXIMUM | DETERMINED BY THE NUMBER OF DIGITS OF ACCURACY FOR THE PARTICULAR IMPLEMENTATION OF THIS SIMULATION. ONE UNIT = 100 METERS |
| AB | X-MIN | " |
| AC | Y-MAX | " |
| AD | Y-MIN | " |
| AE | Z-MAX | " |
| AF | Z-MIN | " |

CELESTIAL OBJECTS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AG | NUMBER | — | RANDOM—DETERMINED BY COMPUTER MEMORY CAPACITY |
| AH | CLASSIFICATION | (AG) | 1 = STAR, 2 = BLACK HOLE, 3 = PARTICLE CLOUD, 4 = TIME/WARP, 5 = PLANET, 6 = MOON, 7 = NOVA |
| AI | NAME | (AG,10) | ALPHABETIC—10 CHARACTERS PER NAME |
| JV | CHARTED | (AG) | 0 = NOT CHARTED, 1 = CHARTED |

LOCATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AJ | X-COORDINATE | (AG) | -INFINITY TO +INFINITY |
| AK | Y-COORDINATE | (AG) | -INFINITY TO +INFINITY |
| AL | Z-COORDINATE | (AG) | -INFINITY TO +INFINITY |

VELOCITY VECTOR

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AM | X/Y DIRECTION | (AG) | — |
| AN | X/Z DIRECTION | (AG) | — |
| AO | SPEED | (AG) | 0 - .99 WARP |
| AP | RADIUS | (AG) | METERS |

RADIATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AQ | TYPE | (AG) | 0 = NONE, 1 = LIGHT, 2 = RADIOACTIVE |
| AR | INTENSITY | (AG) | 0 - 1000 |
| AS | MASS | (AG) | KILOTONS |

LIFE FORMS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AT | QUANTITY | (AG) | 0 - INFINITE |
| AU | CLASSIFICATION | (AG) | 0 = NONE, 1 = HUMANOID, 2 = VEGETATION, 3 = AQUATIC, 4 = OBJECT ITSELF IS INTELLIGENT |
| AV | INTELLIGENCE QUOTIENT | (AG) | 0 - 300 |

<!-- page 49 -->

DEFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| AW | NUMBER | (AG) | 0 OR 1 (MAY BE EXPANDED) |
| AX | TYPE | (1,AW) | 0 = NONE, 1 = SHIELD SCREEN |
| AY | FUNCTIONAL STATUS | (1,AW) | 0 - 100% |
| AZ | OPERATIONAL STATUS | (1,AW) | REL TYPE |
| A1 | RELIABILITY FACTOR | (1,AW) | 0 - 100% |
| A2 | ENERGY REQUIREMENT | (1,AW) | UNITS PER UNIT-TIME |

OFFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| A3 | NUMBER | (AG) | 0 - 3 |
| A4 | TYPE | (3,AG) | 0 = NONE, 1 = PHASER, 2 = PHOTON TORPEDO, 3 = COMMUNICATIONS DISRUPTER, 4 = ULTIMATE DESTRUCT |
| A5 | FUNCTIONAL STATUS | (3,AG) | 0 - 100% |
| A6 | OPERATIONAL STATUS | (3,AG) | REL TYPE |
| A7 | RELIABILITY FACTOR | (3,AG) | 0 - 100% |
| A8 | ENERGY REQUIREMENT | (3,AG) | UNITS PER UNIT-TIME |
| A9 | FIRED UPON FLAG | (AG) | 0 = NOT FIRED UPON, 1 = FIRED UPON |
| BA | PEACE TREATY OFFER | (AG) | 0 = OFFERED, NON-ZERO = CODE OF CRAFT THAT OFFERED |
| BB | PEACE TREATY REQUEST | — | 0 = NOT REQUESTED, 1 = REQUESTED |

ROMULON EMPIRE LOCATION

| Code | Variable Name | Value Range/Units |
|---|---|---|
| BC | X-COORDINATE | -INFINITY TO +INFINITY |
| BD | Y-COORDINATE | -INFINITY TO +INFINITY |
| BE | Z-COORDINATE | -INFINITY TO +INFINITY |
| BF | RADIUS | 0 - INFINITY |

KLINGON EMPIRE LOCATION

| Code | Variable Name | Value Range/Units |
|---|---|---|
| BG | X-COORDINATE | -INFINITY TO +INFINITY |
| BH | Y-COORDINATE | -INFINITY TO +INFINITY |
| BI | Z-COORDINATE | -INFINITY TO +INFINITY |
| BJ | RADIUS | 0 - INFINITY |

### <DATA ASSOCIATED WITH THE ENTERPRISE>

### <ENTERPRISE PERSONNEL DATA>

PERSONNEL

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| BK | NUMBER | — | 43 OFFICERS, 387 CREW ENSIGN GRADE |
| BL | NAME | (BK,10) | RANDOM NAMES, ALPHABETIC 10 CHARACTERS PER NAME |
| BM | RANK | (BK) | 0 = NONEXISTENT, 1 = SCIENCE OFFICER, 2 = ENGINEERING OFFICER |

<!-- page 50 -->

RANK (continued)

| Value | Meaning |
|---|---|
| 3 | MEDICAL OFFICER |
| 4 | CHIEF MEDICAL OFFICER |
| 5 | SECURITY OFFICER |
| 6 | MAINTENANCE CREW |
| 7 | GENERAL CREW |

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| BN | INTELLIGENCE | (BK) | 0 - 300 SEE INTELLIGENCE CHART |
| BO | LOCATION CODE | (BK) | see location code table below |

LOCATION CODE values:

| Code Value | Location |
|---|---|
| -1 | LOCATION IS SPECIFIED BY THE X,Y,Z COORDINATES |
| 0 | BRIDGE |
| 1 | SCIENCES LABORATORY |
| 2 | ENGINEERING |
| 3 | BRIG (PRISON) |
| 4 | SECURITY |
| 5 | NAVIGATION COMPUTER |
| 6 | MEDICAL RESEARCH LABORATORY |
| 7 | MEDICAL COMPUTER |
| 8 | TURBO-ELEVATOR COMPUTER |
| 9 | TRACTOR BEAM |
| 10 | FOOD PROCESSING PLANT |
| 11 | OXYGEN DISTRIBUTION AND RECYCLING |
| 12 | WATER DISTRIBUTION AND RECYCLING |
| 13 | ENERGY SUPPLY |
| 14 | INTENSIVE CARE UNIT |
| 15 | SENSOR STATIONS (ALL 4 SENSOR TYPES) |
| 16 | CREW'S QUARTERS |
| 17 | SHUTTLEBAY |
| 20-29 | TRANSPORTER STATION 0-9 |
| 30-49 | TURBO-ELEVATOR STATION 0-19 |
| 50-69 | TURBO-ELEVATOR 0-19 |
| 70-79 | SHUTTLECRAFT 0-9 |
| 80-83 | PHOTON TORPEDO TUBE STATION 0-3 |
| 90-95 | PHASER STATION 0-5 PORT, STARBOARD, TOP, BOTTOM, FORE, AND AFT |
| 100-105 | DEFLECTOR SHIELD STATION 0-5 PORT, STARBOARD, TOP, BOTTOM, FORE, AND AFT |
| 1000-1NNN | CELESTIAL OBJECT 0-NNN |
| 2000-2NNN | ENEMY CRAFT NNN |
| 3000-3NNN | FEDERATION NNN |
| 4000 | ENTERPRISE |

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| BP | X-COORDINATE | — | — |
| BQ | Y-COORDINATE | — | — |
| BR | Z-COORDINATE | — | — |
| BS | DESTINATION | (Y) | SAME CODES AS LOCATION |

<!-- page 51 -->

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| BT | FUNCTIONAL STATUS | (Y) | 0 - 100%, 0 = DEAD |
| BU | HEALTH STATUS | (Y) | 0 - 10, 0 = DEAD |
| BV | FOOD CONSUMPTION | — | KG/HOUR AVERAGE PER INDIVIDUAL |
| BW | WATER CONSUMPTION | — | LITERS/HOUR AVERAGE PER INDIVIDUAL |
| BX | OXYGEN CONSUMPTION | — | LITERS/HOUR AVERAGE PER INDIVIDUAL |

### <ENTERPRISE WEAPONS DATA>

### <ENTERPRISE OFFENSIVE WEAPONS>

PHOTON TORPEDO TUBES — 6 STATIONS: PORT, STARBOARD, TOP, BOTTOM, FORE, AND AFT

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| BY | FUNCTIONAL STATUS | (6) | 0 - 100% |
| BZ | RELIABILITY FACTOR | (6) | 0 - 100% |
| B1 | ENERGY REQUIREMENT | — | — |
| B2 | NUMBER OF PHOTON TORPEDOS | (6) | 0 - 20 PER STATION |
| B3 | LOCATION OF TORPEDOS | (6,20) | -1 = NO LOCATION(NON-EXISTENT), SEE PERSONNEL LOCATION CODES |
| B4 | DESTINATION | (6,20) | SAME AS ABOVE |

PHASER STATIONS — 6 STATIONS: PORT, STARBOARD, TOP, BOTTOM, FORE, AND AFT

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| B5 | FUNCTIONAL STATUS | (6) | 0 - 100% |
| B6 | OPERATIONAL STATUS | (6) | 0 - 100% |
| B7 | RELIABILITY FACTOR | (6) | 0 - 100% |
| B8 | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

### <ENTERPRISE DEFENSIVE WEAPONS>

DEFLECTOR SHIELDS — FORE, AFT, PORT, STARBOARD, TOP, BOTTOM

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| B9 | FUNCTIONAL STATUS | (6) | 0 - 100% |
| CA | OPERATIONAL STATUS | (6) | 0 - 100% |
| CB | RELIABILITY FACTOR | (6) | 0 - 100% |
| CD | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

CLOAKING DEVICE

| Code | Variable Name | Value Range/Units |
|---|---|---|
| CE | FUNCTIONAL STATUS | 0 - 100% |
| CF | OPERATIONAL STATUS | 0 - 100% |
| CG | RELIABILITY FACTOR | 0 - 100% |

### <ENTERPRISE PROPULSION DATA>

SPACE/WARP ENGINES

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| CH | FUNCTIONAL STATUS | (2) | 0 - 100% |
| CI | OPERATIONAL STATUS | (2) | 1 - 20 WARP |
| CJ | RELIABILITY FACTOR | (2) | 0 - 100% |
| CK | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

IMPULSE ENGINES — 4 ENGINES

<!-- page 52 -->

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| CL | FUNCTIONAL STATUS | (4) | 0 - 100% |
| CM | OPERATIONAL STATUS | (4) | 0 - .99 WARP |
| CN | RELIABILITY FACTOR | (4) | 0 - 100% |
| CO | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

### <ENTERPRISE NAVIGATION DATA>

LOCATION

| Code | Variable Name | Value Range/Units |
|---|---|---|
| CP | X-COORDINATE | -INFINITY TO +INFINITY |
| CQ | Y-COORDINATE | -INFINITY TO +INFINITY |
| CR | Z-COORDINATE | -INFINITY TO +INFINITY |

VELOCITY VECTOR

| Code | Variable Name | Value Range/Units |
|---|---|---|
| CS | X/Y DIRECTION | 0 - 360 DEGREES |
| CT | X/Z DIRECTION | 0 - 360 DEGREES |
| CU | SPEED | 0 - INFINITE WARP |
| CV | DESTINATION CODE | SUBSET OF PERSONNEL LOCATION CODES. INCLUDES CELESTIAL OBJECTS, ENEMY AND FEDERATION CRAFT, SHUTTLECRAFT, AND X,Y,Z COORDINATES. 0 = NO DESTINATION (DEAD STOP), -1 = X,Y,Z COORDINATE |

DESTINATION

| Code | Variable Name | Value Range/Units |
|---|---|---|
| CW | X-COORDINATE | -INFINITY TO +INFINITY |
| CX | Y-COORDINATE | -INFINITY TO +INFINITY |
| CY | Z-COORDINATE | -INFINITY TO +INFINITY |

NAVIGATION COMPUTER

| Code | Variable Name | Value Range/Units |
|---|---|---|
| CZ | FUNCTIONAL STATUS | 0 - 100% |
| C1 | OPERATIONAL STATUS | 0 - 100% |
| C2 | RELIABILITY FACTOR | 0 - 100% |
| C3 | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

### <ENTERPRISE MEDICAL SECTION DATA>

MEDICAL RESEARCH LAB

| Code | Variable Name | Value Range/Units |
|---|---|---|
| C4 | FUNCTIONAL STATUS | 0 - 100% |
| C5 | OPERATIONAL STATUS | 0 - 100% |
| C6 | RELIABILITY FACTOR | 0 - 100% |
| C7 | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

INTENSIVE CARE UNIT

| Code | Variable Name | Value Range/Units |
|---|---|---|
| C8 | FUNCTIONAL STATUS | 0 - 100% |
| C9 | OPERATIONAL STATUS | 0 - 100% |
| DA | RELIABILITY FACTOR | 0 - 100% |
| DB | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |
| DC | PATIENT CAPACITY | (TBD) |

MEDICAL COMPUTER

| Code | Variable Name | Value Range/Units |
|---|---|---|
| DD | FUNCTIONAL STATUS | 0 - 100% |
| DE | OPERATIONAL STATUS | 0 - 100% |
| DF | RELIABILITY FACTOR | 0 - 100% |

<!-- page 53 -->

| Code | Variable Name | Value Range/Units |
|---|---|---|
| DG | ENERGY REQUIREMENT | UNITS PER UNIT-TIME AND NUMBER OF PATIENTS |

MEDICAL SUPPLY

| Code | Variable Name | Value Range/Units |
|---|---|---|
| DH | QUANTITY | UNITS |

### <ENTERPRISE SHUTTLECRAFT DATA>

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| DI | OPERATIONAL STATUS | (6) | 0 = IN SHUTTLE BAY, 1 = ON MISSION |

LOCATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| DJ | X-COORDINATE | (6) | -INFINITY TO +INFINITY |
| DK | Y-COORDINATE | (6) | -INFINITY TO +INFINITY |
| DL | Z-COORDINATE | (6) | -INFINITY TO +INFINITY |

VELOCITY VECTOR

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| DM | X/Y DIRECTION | (6) | 0 - 360 DEGREES |
| DN | X/Z DIRECTION | (6) | 0 - 360 DEGREES |
| DO | SPEED | (6) | KILOMETERS PER SECOND |
| DP | MISSION | (6) | 0 = NONE, 1 = SEEK SENSOR DATA, 2 = DELIVER CARGO, 3 = TRANSPORT PERSONNEL, 4 = SEEK SHUTTLE BAY |
| DQ | DESTINATION | (6) | SAME AS ENTERPRISE LOCATION CODES |

SHUTTLECRAFT PROPULSION TUBES — 2 TUBES FOR EACH OF 6 SHUTTLECRAFT

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| DR | FUNCTIONAL STATUS | (6,2) | 0 - 100% |
| DS | OPERATIONAL STATUS | (6,2) | 0 - 100% |
| DT | RELIABILITY FACTOR | (6,2) | 0 - 100% |
| DU | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |
| DV | CARGO | (6) | — |

SHUTTLECRAFT SENSOR ARRAY

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| DW | FUNCTIONAL STATUS | (6) | 0 - 100% |
| DX | OPERATIONAL STATUS | (6) | 0 - 100% |
| DY | RELIABILITY FACTOR | (6) | 0 - 100% |
| DZ | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

SHUTTLECRAFT DEFENSIVE WEAPONS: PHASER — ONE PHASER PER SHUTTLECRAFT

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| D1 | FUNCTIONAL STATUS | (6) | 0 - 100% |
| D2 | OPERATIONAL STATUS | (6) | 0 - 100% |
| D3 | RELIABILITY | (6) | 0 - 100% |
| D4 | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

SHUTTLECRAFT OFFENSIVE WEAPONS: DEFLECTOR SHIELDS — ONE SHIELD PER CRAFT

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| D5 | FUNCTIONAL STATUS | (6,2) | 0 - 100% |
| D6 | OPERATIONAL STATUS | (6,2) | 0 - 100% |
| D7 | RELIABILITY FACTOR | (6,2) | 0 - 100% |
| D8 | ENERGY REQUIREMENT | — | UNITS PER UNIT-TIME |

*(Note: the labels "Defensive Weapons: Phaser" and "Offensive Weapons: Deflector Shields" appear exactly as printed in the source, though this pairing of terms seems reversed from the labeling convention used elsewhere in the book.)*

<!-- page 54 -->

### <ENTERPRISE INTRA-SHIP TRANSPORTATION DATA>

TURBO-ELEVATOR STATIONS — 10 STATIONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| D9 | FUNCTIONAL STATUS | (10) | 0 - 100% |
| EA | OPERATIONAL STATUS | (10) | 0 - 100% |
| EB | RELIABILITY FACTOR | (10) | 0 - 100% |

TURBO-ELEVATOR CARS — 6 TURBO-ELEVATOR CARS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| EC | FUNCTIONAL STATUS | (6) | 0 - 100% |
| ED | LOCATION | (6) | SEE PERSONNEL LOCATION CODES 0 THROUGH 15 |
| EF | DESTINATION | (6) | SAME AS ABOVE |
| EG | ARRIVAL TIME | (6) | UNITS |

TURBO-ELEVATOR COMPUTER

| Code | Variable Name | Value Range/Units |
|---|---|---|
| EH | FUNCTIONAL STATUS | 0 - 100% |
| EI | OPERATIONAL STATUS | 0 - 100% |
| EJ | RELIABILITY FACTOR | 0 - 100% |
| EK | ENERGY REQUIREMENT | UNITS PER PASSENGER |

### <ENTERPRISE TRANSPORTER DATA>

STATIONS — 10 STATIONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| EL | FUNCTIONAL STATUS | (10) | 0 - 100% |
| EM | OPERATIONAL STATUS | (10) | 0 - 100% |
| EN | RELIABILITY FACTOR | (10) | 0 - 100% |
| EO | ENERGY REQUIREMENT | — | UNITS PER TRANSPORT; REL DISTANCE |

### <ENTERPRISE TRACTOR BEAM DATA>

TRACTOR BEAM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| EP | FUNCTIONAL STATUS | 0 - 100% |
| EQ | OPERATIONAL STATUS | 0 - 100% |
| ER | RELIABILITY FACTOR | 0 - 100% |
| ES | INDENTITY OF OBJECT BEING PULLED | SEE PERSONNEL LOCATION CODES FOR CELESTIAL OBJECTS, ENEMY AND FEDERATION CRAFT, AND SHUTTLECRAFT. 0 = NO OBJECT |
| ET | ENERGY REQUIREMENT | UNITS PER UNIT-TIME; REL OBJECT MASS, AND VELOCITY VECTOR, AND OPERATIONAL STATUS OF OBJECT'S ENGINES IF APPLICABLE |

### <ENTERPRISE LIFE SUPPORT SYSTEMS DATA>

FOOD SUPPLY

| Code | Variable Name | Value Range/Units |
|---|---|---|
| EU | QUANTITY | 0 TO 100000 KILOGRAMS |
| EV | NUTRITION LEVEL | 0 - 100% |
| EW | MAXIMUM QUANTITY | UNITS |
| EX | POLLUTION LEVEL | 0 - 100% |

<!-- page 55 -->

FOOD RECYCLE SYSTEM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| EY | MAXIMUM CAPACITY | FOOD UNITS |
| EZ | FUNCTIONAL STATUS | 0 - 100% |
| E1 | OPERATIONAL STATUS | 0 - 100% |
| E2 | RELIABILITY FACTOR | 0 - 100% |
| E3 | ENERGY REQUIREMENT | 0 - 100% |

OXYGEN

| Code | Variable Name | Value Range/Units |
|---|---|---|
| E4 | QUANTITY | 0 - 1 BILLION CUBIC FEET |
| E5 | MAXIMUM QUANTITY | UNITS, CUBIC FEET |
| E6 | POLLUTION LEVEL | 0 - 100% |

OXYGEN DISTRIBUTION SYSTEM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| E7 | FUNCTIONAL STATUS | 0 - 100% |
| E8 | OPERATIONAL STATUS | 0 - 100% |
| E9 | RELIABILITY FACTOR | 0 - 100% |
| FA | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

OXYGEN RECYCLE SYSTEM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FB | FUNCTIONAL STATUS | 0 - 100% |
| FC | OPERATIONAL STATUS | 0 - 100% |
| FD | RELIABILITY FACTOR | 0 - 100% |
| FE | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

WATER

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FF | QUANTITY | 0 - 1 MILLION KILOLITERS |
| FG | MAXIMUM QUANITTY | KILOLITERS |
| FH | POLLUTION LEVEL | 0 - 100% |

WATER DISTRIBUTION SYSTEM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FI | FUNCTIONAL STATUS | 0 - 100% |
| FJ | OPERATIONAL STATUS | 0 - 100% |
| FK | RELIABILITY FACTOR | 0 - 100% |
| FL | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

WATER RECYCLE SYSTEM

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FM | FUNCTIONAL STATUS | 0 - 100% |
| FN | OPERATIONAL STATUS | 0 - 100% |
| FO | RELIABILITY FACTOR | 0 - 100% |
| FP | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

### <ENTERPRISE COMMUNICATION DATA>

### <INTRA- AND INTER-SHIP COMMUNICATIONS DATA>

MESSAGES — ONE PER COMMUNICATIONS STATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| FQ | MESSAGE COUNT | — | 0 - 10 |
| FR | MESSAGE STACK | (10,100) | ALPHA-NUMERICS, MAXIMUM OF 10 100 CHARACTER MESSAGES |

### <INTER-CELESTIAL COMMUNICATIONS DATA>

ENTERPRISE COMMUNICATIONS COMPUTER

<!-- page 56 -->

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FS | FUNCTIONAL STATUS | 0 - 100% |
| FT | OPERATIONAL STATUS | 0 - 100% |
| FU | RELIABILITY FACTOR | 0 - 100% |
| FV | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

### <ENTERPRISE SECURITY DATA>

DETENTION CELL — ONE DETENTION CELL

| Code | Variable Name | Value Range/Units |
|---|---|---|
| FW | FUNCTIONAL STATUS | 0 - 100% |
| FX | OPERATIONAL STATUS | 0 - 100% |
| FY | RELIABILITY FACTOR | 0 - 100% |
| FZ | ENERGY REQUIREMENTS | UNITS PER PRISONER |
| F1 | MAXIMUM PRISONER CAPACITY | 30 |

### <ENTERPRISE ENERGY SUPPLY DATA>

ENERGY

| Code | Variable Name | Value Range/Units |
|---|---|---|
| F2 | QUANTITY | 0 - MAXIMUM |
| F3 | MAXIMUM QUANTITY | 20 BILLION UNITS |

ENERGY SUPPLY INTERCONNECT SYSTEM — 22 STATIONS

CONNECTION STATION CODES:

| Code | Station |
|---|---|
| 1 | PHOTON TORPEDO TUBES |
| 2 | PHASER STATIONS |
| 3 | DEFLECTOR SHIELDS |
| 4 | SPACE/WARP ENGINES |
| 5 | IMPULSE ENGINES |
| 6 | NAVIGATION COMPUTER |
| 7 | RESEARCH LAB |
| 8 | INTENSIVE CARE UNIT |
| 9 | MEDICAL COMPUTER |
| 10 | TURBO-ELEVATOR COMPUTER |
| 11 | TRANSPORTERS |
| 12 | TRACTOR BEAM |
| 13 | OXYGEN DISTRIBUTION SYSTEM |
| 14 | OXYGEN RECYCLE SYSTEM |
| 15 | WATER DISTRIBUTION SYSTEM |
| 16 | WATER RECYCLE SYSTEM |
| 17 | COMMUNICATIONS COMPUTER |
| 18 | SECURITY |
| 19 | RADIATION SENSOR |
| 20 | GRAVITY SENSOR |
| 21 | LIFE FORMS SENSOR |
| 22 | ATMOSPHERIC SENSOR |

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| F4 | FUNCTIONAL STATUS | (22) | 0 - 100% |
| F5 | OPERATIONAL STATUS | (22) | 0 - 100% |
| F6 | RELIABILITY FACTOR | (22) | 0 - 100% |
| F7 | ENERGY SUPPLY | (22) | UNITS OF ENERGY AVAILABLE TO THE SPECIFIED DEVICE |

### <ENTERPRISE SENSOR ARRAY DATA>

RADIATION SENSOR

<!-- page 57 -->

| Code | Variable Name | Value Range/Units |
|---|---|---|
| F8 | FUNCTIONAL STATUS | 0 - 100% |
| F9 | OPERATIONAL STATUS | 0 - 100% |
| GA | RELIABILITY FACTOR | 0 - 100% |
| GB | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

GRAVITY SENSOR

| Code | Variable Name | Value Range/Units |
|---|---|---|
| GC | FUNCTIONAL STATUS | 0 - 100% |
| GD | OPERATIONAL STATUS | 0 - 100% |
| GE | RELIABILITY FACTOR | 0 - 100% |
| GF | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

LIFE FORMS SENSOR

| Code | Variable Name | Value Range/Units |
|---|---|---|
| GH | FUNCTIONAL STATUS | 0 - 100% |
| GI | OPERATIONAL STATUS | 0 - 100% |
| GJ | RELIABILITY FACTOR | 0 - 100% |
| GK | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

ATMOSPHERIC SENSORS

| Code | Variable Name | Value Range/Units |
|---|---|---|
| GL | FUNCTIONAL STATUS | 0 - 100% |
| GM | OPERATIONAL STATUS | 0 - 100% |
| GN | RELIABILITY FACTOR | 0 - 100% |
| GO | ENERGY REQUIREMENT | UNITS PER UNIT-TIME |

### <ENTERPRISE CARGO DATA>

| Code | Variable Name | Value Range/Units |
|---|---|---|
| GP | CARGO() | 0 = FOOD, 1 = WATER, 2 = OXYGEN, 3 = ENERGY, 4 = BOMB |
| GQ | QUANTITY() | — |
| GR | LOCATION() | SEE PERSONNEL LOCATION CODES |

### <ENTERPRISE GENERAL DATA>

| Code | Variable Name | Value Range/Units |
|---|---|---|
| G3 | ALERT STATUS | 0 = NORMAL, 1 = YELLOW, 2 = GREEN, 3 = RED |

### <DATA ASSOCIATED WITH ENEMY SHIPS>

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| GT | NUMBER OF ENEMY SHIPS | — | 0 - 1000 |
| GU | NAME | (1000,10) | ALPHANUMERIC, 10 CHARACTERS EACH |
| GV | EXISTENCE | (1000) | 0 = DESTROYED, 1 = EXISTS |

### <DEFENSIVE WEAPONS DATA>

DEFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| GW | NUMBER | (1000) | 0 - 2 |
| GX | TYPE | (1000,2) | 1 = CLOAKING DEVICE |

<!-- page 58 -->

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| — | (continued) | | 2 = DEFLECTOR SHIELDS |
| GY | FUNCTIONAL STATUS | (1000,2) | 0 - 100% |
| GZ | OPERATIONAL STATUS | (1000,2) | 0 - 100% |
| G1 | RELIABILITY FACTOR | (1000,2) | 0 - 100% |
| G2 | ENERGY REQUIREMENT | (1000,2) | REL TYPE |

OFFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| G3 | NUMBER | (1000) | 0 - 2 |
| G4 | TYPE | (1000,2) | 1 = PHASERS, 2 = PHOTON TORPEDOS |
| G5 | FUNCTIONAL STATUS | (1000,2) | 0 - 100% |
| G6 | OPERATIONAL STATUS | (1000,2) | 0 - 100% |
| G7 | RELIABILITY FACTOR | (1000,2) | 0 - 100% |
| G8 | ENERGY REQUIREMENT | (1000,2) | REL TYPE |

### <ENEMY SHIPS LIFE FORMS DATA>

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| HA | TYPE OF LIFE FORM | (1000) | 0 = NONE, 1 = HUMANOID, 2 = VEGETATION, 3 = AQUATIC, 4 = INTELLIGENT SHIP (NO LIFE BUT SELF-SUFFICIENT CRAFT, A ROBOT SHIP) |
| HB | NUMBER | (1000) | 0 - INFINITE |
| HC | INTELLIGENCE LEVEL | (1000) | 0 - 300 AVERAGE INTELLIGENCE |
| HD | FUNCTIONAL STATUS | (1000) | 0 - 100% |
| HE | OPERATIONAL STATUS | (1000) | 0 - 100% |
| HF | RELIABILITY FACTOR | (1000) | 0 - 100% |
| HG | HEALTH STATUS | (1000) | — |

### <ENEMY SHIPS NAVIGATION DATA>

LOCATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| HH | X-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| HI | Y-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| HJ | Z-COORDINATE | (1000) | -INFINITY TO +INFINITY |

VELOCITY VECTOR

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| HK | X/Y DIRECTION | (1000) | 0 - 360 DEGREES |
| HL | X/Z DIRECTION | (1000) | 0 - 360 DEGREES |
| HM | SPEED | (1000) | 0 - 20 WARP |
| HN | MAXIMUM SPEED CAPABILITY | (1000) | 0 - 20 WARP |
| HO | DESTINATION | (1000) | SEE ENTERPRISE PERSONNEL LOCATION CODES FOR CELESTIAL OBJECTS, ENEMY AND FEDERATION CRAFT, AND SHUTTLECRAFT; -1 = DESTINATION IS SPECIFIED BY THE X,Y, AND Z COORDINATES |
| HP | X-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| HQ | Y-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| HR | Z-COORDINATE | (1000) | -INFINITY TO +INFINITY |

<!-- page 59 -->

NAVIGATION COMPUTER

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| HS | FUNCTIONAL STATUS | (1000) | 0 - 100% |
| HT | OPERATIONAL STATUS | (1000) | 0 - 100% |
| HU | RELIABILITY FACTOR | (1000) | 0 - 100% |
| HV | ENERGY REQUIREMENT | (1000) | UNITS PER UNIT-TIME |
| HW | MISSION | (1000) | 0 = NO MISSION, SHIP NON-EXISTENT; 1 = CONDITIONAL ATTACK; 2 = UNCONDITIONAL ATTACK; 3 = ESTABLISH PEACE TREATY; 4 = SEARCH AND CONQUER CIVILIZATION; 5 = WEAPONS DELIVERY; 6 = PEACEFUL CARGO DELIVERY |

CARGO

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| HX | CARGO | (1000) | SEE ENTERPRISE CARGO CODES |
| HY | QUANTITY | (1000) | UNITS |
| HZ | LOCATION | (1000) | SEE ENTERPRISE PERSONNEL LOCATION CODES |
| H1 | DESTINATION | (1000) | SAME AS ABOVE; -1 = DESTINATION SPECIFIED IN THE FOLLOWING X,Y,Z COORDINATES |
| H2 | X-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| H3 | Y-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| H4 | Z-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| H5 | PEACE TREATY OFFERED FLAG | (1000) | 0 = NOT OFFERED BY OTHER CRAFT, NON-ZERO = PEACE TREATY OFFERED BY OTHER CRAFT. THE CODE IN THIS VARIABLE IS THE CODE OF THE CRAFT OFFERING THE PEACE TREATY. SEE PERSONNEL LOCATION CODES 1000 TO 4000. |
| H6 | PEACE TREATY REQUEST FLAG | (1000) | 1 = REQUESTED BY THIS CRAFT, 0 = NOT REQUESTED |

### <ENEMY SHIP POWER SUPPLY>

ENERGY

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| H7 | QUANTITY | (1000) | 0 - 10^10 UNITS |
| H8 | FIRED UPON FLAG | (1000) | 0 = NOT FIRED UPON, NON-ZERO = CODE OF WHO FIRED. SEE ENTERPRISE PERSONNEL LOCATION CODES 1000 - 3000 |

### <DATA ASSOCIATED WITH FEDERATION SHIPS>

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| H9 | NUMBER OF FEDERATION SHIPS | — | 0 - 1000 |
| IA | NAME | (1000,10) | ALPHANUMERIC, 10 CHARACTERS EACH |
| IB | EXISTENCE | (1000) | 0 = DESTROYED, 1 = EXISTS |

<!-- page 60 -->

### <DEFENSIVE WEAPONS DATA>

DEFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| IC | NUMBER | (1000) | — |
| ID | TYPE | (1000,2) | 1 = DEFLECTOR SHIELDS, 2 = CLOAKING DEVICE |
| IE | FUNCTIONAL STATUS | (1000,2) | 0 - 100% |
| IF | OPERATIONAL STATUS | (1000,2) | 0 - 100% |
| IG | RELIABILITY FACTOR | (1000,2) | 0 - 100% |
| IH | ENERGY REQUIREMENT | (1000,2) | REL TYPE |

OFFENSIVE WEAPONS

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| IJ | NUMBER | (1000) | 0 - 2 |
| IK | TYPE | (1000,2) | 1 = PHASERS, 2 = PHOTON TORPEDO |
| IL | FUNCTIONAL STATUS | (1000,2) | 0 - 100% |
| IM | OPERATIONAL STATUS | (1000,2) | 0 - 100% |
| IN | RELIABILITY FACTOR | (1000,2) | 0 - 100% |
| IO | ENERGY REQUIREMENT | (1000,2) | 0 - 100% |

### <FEDERATION SHIPS LIFE FORMS DATA>

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| IP | NUMBER | (1000) | 0 TO 10000 PERSONS |
| IQ | INTELLIGENCE | (1000) | AVERAGE |
| IS | OPERATIONAL STATUS | (1000) | 0 - 100% |
| IT | RELIABILITY FACTOR | (1000) | 0 - 100% |
| IU | HEALTH STATUS | (1000) | 0 - 100% |

### <FEDERATION SHIPS NAVIGATION DATA>

LOCATION

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| IV | X-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| IW | Y-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| IX | Z-COORDINATE | (1000) | -INFINITY TO +INFINITY |

VELOCITY VECTOR

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| IY | X/Y DIRECTION | (1000) | 0 - 360 DEGREES |
| IZ | X/Z DIRECTION | (1000) | 0 - 360 DEGREES |
| I1 | SPEED | (1000) | 0 - 20 WARP |
| I2 | MAXIMUM SPEED | (1000) | 0 - 20 WARP |
| I3 | DESTINATION CODE | (1000) | SEE ENTERPRISE PERSONNEL LOCATION CODES FOR CELESTIAL OBJECTS, ENEMY AND FEDERATION CRAFT, AND SHUTTLECRAFT; -1 = DESTINATION SPECIFIED IN THE FOLLOWING X,Y,Z |
| I4 | X-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| I5 | Y-COORDINATE | (1000) | -INFINITY TO +INFINITY |
| I6 | Z-COORDINATE | (1000) | -INFINITY TO +INFINITY |

NAVIGATION COMPUTER

| Code | Variable Name | Dimensions | Value Range/Units |
|---|---|---|---|
| I7 | FUNCTIONAL STATUS | (1000) | 0 - 100% |
| I8 | OPERATIONAL STATUS | (1000) | 0 - 100% |
