<!-- page 28 -->

Once the person or cargo is at the T/E station which services his destination the communications module takes over and sends him or it to the proper destination.

If a person or cargo is given a destination outside of the Enterprise (such as a shuttlecraft already on a mission, a planet, another Federation craft) when its current location is within the Enterprise then it is first sent to one of the transporters or one of the shuttlecraft, depending upon the distance to the destination. When the person or cargo arrives at the transporter or shuttlecraft bay the engineering module takes over to complete the transfer.

All of this occurs as the result of one command by the communications officer to transfer some person or cargo. After the command, everything is taken care of automatically by the simulation software.

| FUNCTION | COMMAND FORMAT |
|---|---|
| Display next Message | D M |
| Send Distress message | S D |
| Request Personnel movement | R P personnel name, destination |
| Request Cargo movement | R C cargo type, destination |
| Request Aid | R A federation craft name |
| Send Peace Offer to enemy craft | S P O craft name |
| Accept Peace Offer from enemy craft | A P O craft name |
| Reject Peace Offer from enemy craft | R P O craft name |

**Figure 3.4 COMMUNICATIONS MODULE COMMANDS**

The communications officer can send several types of messages to Federation and enemy craft and can receive messages from any number of positions aboard the Enterprise as well as from other craft and planets. The preliminary design for the communications display shows that a convention has been established for receiving messages. The communications officer may display only one incoming message at a time. The messages are kept in a list (a first-in-first-out queue). If the list gets filled then subsequent messages will be lost. The officer displays the next message on the list by executing the D M command which effectively removes the next message from the list and displays it and makes room for another message on the list.

<!-- page 29 -->

*Figure 3.5 COMMUNICATIONS DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen mockup diagram with the following labeled fields/boxes:*

- NUMBER OF MESSAGES PENDING: ___________
- MESSAGE: (large text box)
- COMMUNICATIONS COMPUTER
  - FUNCTIONAL STATUS ______
  - OPERATIONAL STATUS ______
- PERSONNEL table with three repeated column groups, each with columns: NAME, RANK, LOCATION
- ALERTS (box)
- COMMAND (box)

<!-- page 30 -->

| TURBO ELEVATOR STATION NUMBER (SERVICE AREA) | AREAS SERVED |
|---|---|
| 1 | BRIDGE; SENSOR STATIONS; TRANSPORTER #1; PHASER STATION #1 |
| 2 | SCIENCES LABORATORY; TRANSPORTER #2; TORPEDO TUBE #1; DEFLECTOR SHIELD STATION #1 |
| 3 | ENGINEERING; TRANSPORTER #3; PHASER STATION #2 |
| 4 | NAVIGATION COMPUTER; TRANSPORTER #4; TORPEDO TUBE #2; DEFLECTOR SHIELD STATION #2 |
| 5 | MEDICAL RESEARCH LABORATORY; MEDICAL COMPUTER; INTENSIVE CARE UNIT; TRANSPORTER #5; PHASER STATION #3 |
| 6 | TURBO/ELEVATOR COMPUTER; FOOD PROCESSING PLANT; OXYGEN DISTRIBUTION AND RECYCLING CENTER; WATER DISTRIBUTION AND RECYCLING CENTER; TRANSPORTER #6; TORPEDO TUBE #3; DEFLECTOR SHIELD STATION #3 |
| 7 | TRACTOR BEAM; TRANSPORTER #7; PHASER STATION #4 |
| 8 | ENERGY SUPPLY; TRANSPORTER #8; TORPEDO TUBE #4; DEFLECTOR SHIELD STATION #4 |
| 9 | TRANSPORTER #9; PHASER STATION #5; DEFLECTOR SHIELD STATION #5 |
| 10 | TRANSPORTER #10; SHUTTLE BAY (ALL SHUTTLECRAFT); PHASER STATION #6; DEFLECTOR SHIELD STATION #6 |

**Figure 3.6 AREAS SERVED BY TURBO/ELEVATORS**

When a person or cargo is given a destination the communications and engineering modules effect the transfers. The time for transfer within a T/E service area is one minute. The time for transfer between T/E service areas is the difference in area numbers times one-half minute.

<!-- page 31 -->

Obviously, the officer must respond quickly so he does not lose any messages. While that may sound like a poor way to handle incoming messages it is certainly comparable to real-life situations.

| PERSONNEL | YELLOW ALERT | GREEN ALERT | RED ALERT |
|---|---|---|---|
| SCIENCE | 10% SCIENCE LAB<br>90% CREW'S QUARTERS | 50% SCIENCE LAB<br>50% CREW'S QUARTERS | 100% SCIENCE LAB |
| ENGINEERING | 10% ENGINEERING<br>90% CREW'S QUARTERS | 50% ENGINEERING<br>50% CREW'S QUARTERS | 100% ENGINEERING |
| MEDICAL | 20% MEDICAL LAB<br>20% INTENSIVE CARE<br>60% CREW'S QUARTERS | 40% MEDICAL LAB<br>40% INTENSIVE CARE<br>20% CREW'S QUARTERS | 50% MEDICAL LAB<br>50% INTENSIVE CARE |
| CHIEF MEDICAL OFFICER | INTENSIVE CARE | INTENSIVE CARE | INTENSIVE CARE |
| SECURITY | 20% SECURITY<br>80% CREW'S QUARTERS | 50% SECURITY<br>50% CREW'S QUARTERS | 100% SECURITY |
| MAINTENANCE | 20% EVENLY DISTRIBUTED | 50% EVENLY DISTRIBUTED | 100% EVENLY DISTRIBUTED AMONG AREAS REQUIRING REPAIR |
| GENERAL CREW | 30% EVENLY DISTRIBUTED<br>70% CREW'S QUARTERS | 50% EVENLY DISTRIBUTED<br>50% CREW'S QUARTERS | 90% EVENLY DISTRIBUTED<br>10% CREW'S QUARTERS |

**Figure 3.7 PERSONNEL ASSIGNED LOCATIONS**

Each personnel has an assigned location associated with the current alert status. For normal alert each personnel remains where he is assigned by the communications officer. For the other alerts they are distributed as specified in this chart.

### Navigation

The navigation module provides the facilities for laying in courses for point-to-point travel. It calculates, utilizing the navigation

<!-- page 32 -->

*computer,* courses for establishing orbits around planets or other celestial objects. It provides a display of the projected universe and the local sector including the ship's current position and course as well as the course of enemy and friendly craft. It maintains the ship's chronometer (real-time clock). It simulates the intelligence and tactical maneuvers of enemy and Federation space craft and the Enterprise shuttlecraft. It simulates the natural physical interactions of celestial objects (gravity, etc.). Unlike most STAR TREK games where the enemy craft sit in one spot and fire only when the Enterprise makes a move, the enemy craft in the simulation roam throughout the universe, some looking to attack Federation space ships, others trying to conquer civilizations, deliver goods or weapons, or seeking peace treaties.

There are Federation craft as well. They, too, are intelligent. Indeed, there can be battles waged between enemy and Federation craft at one end of the universe as the Enterprise traverses the other end completely unaware of the encounter. A war may be won without the Enterprise even knowing about it.

| FUNCTION | COMMAND FORMAT |
|---|---|
| Set Course to Coordinates | S C C x, y, z |
| Set Course to specified Object | S C O object name |
| Evasive Tactics | E T |
| Set Velocity | S V velocity value |
| Set Direction | S D x/y angle x/z angle |
| Establish Orbit | E O |

**Figure 3.8 NAVIGATION COMMANDS**

### Sciences

The sciences module monitors the functional status of the life support systems, including food, air, and water supply. It also monitors the life forms, gravity, radiation, functional status, and fire power of planets and other space craft via the sensors on board the Enterprise.

The science officer can request sensor data of celestial objects or general sensor scan of areas of space. The type of data displayed is determined by the object being scanned. The amount and accuracy of the displayed data is related to the functional status of the sensors, the science computer, the distance to the

<!-- page 33 -->

*Figure 3.9 THREE-DIMENSIONAL COORDINATE SYSTEM — a diagram of a sphere/globe showing the three-dimensional coordinate system with the Enterprise positioned in the upper right. Labeled axes and points:*

- +Z (top pole), -Z (bottom pole)
- +X, -X
- +Y, -Y
- Ø (origin, center)
- X/Y (angle arc shown from origin)
- X/Z (angle arc shown from origin, near the Enterprise)

Unique positions within the universe are specified by a set of x, y, and z coordinates, each value being within its defined minimum and maximum limits (see the common data table). It is assumed that each unit of value represents 100 meters. This means that the smallest resolution within the universe is 100 meters.

To specify a direction of the Enterprise within the universe, as in setting the course with the S D command, two angles must be specified. The angles assume that a local coordinate system exists with its 0, 0, 0 point at the center of the Enterprise and its positive x-axis directed straight ahead. The x/y angle denotes the positive angle measured from the positive x-axis towards the positive y-axis. The x/z angle denotes the positive angle measured from the positive x/y plane towards the positive z-axis.

<!-- page 34 -->

*Figure 3.10 NAVIGATION DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen mockup diagram with the following labeled fields/boxes:*

- Left info box:
  - SECTOR __________
  - QUADRANT __________
  - X-COORDINATE______
  - Y-COORDINATE______
  - Z-COORDINATE______
  - X/Y DIRECTION______
  - X/Z DIRECTION______
  - DESTINATION:
    - NAME __________
    - X-COORDINATE______
    - Y-COORDINATE______
    - Z-COORDINATE______
  - ETA__________________
- Center box labeled "ASTROGATOR": a plotting grid with tick marks on both axes, showing the Enterprise symbol at the center-origin, and several plotted objects: a star base symbol (upper left), a UFP craft symbol (right of center), a Klingon symbol (lower area), and a star symbol (lower left)
- Right box labeled "SYMBOL KEY" listing symbols and meanings:
  - ENTERPRISE
  - KLINGON
  - ROMULON
  - STAR BASE
  - UFP CRAFT
  - TORPEDO
  - SHUTTLECRAFT
  - STAR
  - PLANET
  - RADIATION
  - TIME WARP
  - UNIDENTIFIED
- Bottom: CHRONOMETER — two groups of eight digit-boxes (each digit box marked "o")
- ALERTS (box)
- COMMAND: (box)

<!-- page 35 -->

object, and the presence of sensor-data-seeking shuttlecraft (i.e. if such a shuttlecraft is near the object then the sensor data quality is proportionally increased).

| FUNCTION | COMMAND FORMAT |
|---|---|
| Scan Specified Object | S S O object name |
| Scan Area | S A x, y, z |
| Scan Randomly | S R |

**Figure 3.11 SCIENCES COMMANDS**

### Engineering

The engineering module maintains the status of the shuttlecraft, transporters, energy supply, space/warp and impulse engines, main craft structural damage, turbo/elevators, etc. It allows the engineer to specify the distribution of energy to the various sections of the ship.

Each of the shuttlecraft has an assigned mission, initially set to *none*. The valid mission types are DELIVER CARGO, SEEK SENSOR DATA, TRANSPORT PERSONNEL, and SEEK THE ENTERPRISE. By means of the communications module personnel may be sent to the shuttlecraft and cargo may be loaded onto them, provided, of course, that the specified shuttlecraft is in the shuttle bay. Once a shuttlecraft is assigned a mission, it departs from the shuttle bay, attempts to perform its mission, and then returns to the Enterprise.

For a DELIVER CARGO mission the craft will travel to the specified destination, normally another Federation craft or an inhabited planet, transfer the cargo, and then return to the Enterprise.

If the craft is seeking sensor data then it will travel to the specified destination and send back data to the Enterprise. This is accomplished by increasing the functional status of the Enterprise's sensors as the shuttle nears its destination.

The TRANSPORT PERSONNEL mission is similar to the transport of cargo except that several personnel may be aboard the shuttle, each with a different destination. In this case the personnel will each be delivered to his respective destination before the shuttle returns to the Enterprise.

SEEK THE ENTERPRISE will cause the specified shuttle to return to the shuttle bay.

<!-- page 36 -->

*Figure 3.12 SCIENCES DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen mockup diagram with the following labeled fields/boxes:*

- SCIENCES COMPUTER box: OPERATIONAL STATUS, FUNCTIONAL STATUS
- A scan/plot box showing a planet (large stippled circle) and a star (small circle) with tick marks on the axes
- LIFE SUPPORT bar chart with vertical axis 0-100, three bars labeled AIR (value 53), WATER (value 61), FOOD (value 32)
- Data list box:
  - IDENTITY.....................
  - LIFE FORMS..................
  - RADIATION...................
  - WEAPONS.....................
  - VELOCITY....................
  - POSITION:
    - X..........................
    - Y..........................
    - Z..........................
  - RADIUS......................
  - MASS........................
  - GRAVITY.....................
  - MISCELLANEOUS...............
- ALERTS (box)
- COMMAND: (box)

<!-- page 37 -->

Whenever a command is given to one of the shuttlecraft, whether or not it receives the command is dependent upon the functional status of the Enterprise's communications systems and the distance to the specified shuttle.

Another function of the engineering module is to allow energy to be distributed to the various devices and sections of the ship. Initially every device receives an equal share. However, in situations where the total energy supply is low and the Enterprise is in a combat situation the captain might decide to divert more energy to the life-support systems, deflector shields, and defensive weapons. Increasing the energy supply for one device proportionally decreases the supply to all other devices.

Setting an energy level to a ship section sets all of the energy supply levels for the associated devices. See figure 3.13.

Note that in general the more energy available to a device the more powerful it is and the quicker it will be repaired when damaged (although this last function is also related to other attributes such as the number of maintenance personnel at the device location).

The last command of the engineering module is to display information about the various devices on board the Enterprise. This is accomplished with the REPORT STATUS OF DEVICE command.

The engineering task of maintaining the transporters involves not only keeping them in working order but also recognizing when there are personnel or cargo to be transported. When such a situation exists, as a result of the communications officer sending someone or something to the transporter or to a location outside of the Enterprise but within transport distance, the engineering module does the actual transport. Of course, the success of the transport depends upon the functional status of the transporter. It is possible to be injured or killed, or cargo to be destroyed by a malfunctioning transporter. Particularly note that if explosive cargo is being transported the resultant explosion can also damage the transporter.

| FUNCTION | COMMAND FORMAT |
|---|---|
| Report Status of device | R S device code |
| Set Shuttlecraft mission | S S shuttlename, mission, destination |
| set Energy supply to Device | E D device code |

<!-- page 38 -->

| DEVICE CODE | MEANING | SHIP SECTION |
|---|---|---|
| T | torpedo tube | *(none listed)* |
| P | phaser station | A |
| D | deflector shield | A |
| W | space warp engines | A |
| IE | impulse engines | B |
| NC | navigation computer | B |
| R | research laboratory | B |
| IC | intensive care unit | C |
| MC | medical computer | C |
| TC | T/E computer | C |
| T | transporter | D |
| TB | tractor beam | D |
| OD | oxygen distribution | D |
| OR | oxygen recycling | E |
| WD | water distribution | E |
| WR | water recycling | E |
| CC | communication computer | E |
| S | security | F |
| RS | radiation sensor | G |
| GS | gravitation sensor | H |
| LS | life forms sensor | H |
| AS | atmospheric sensor | H |
| *(no code shown)* | *(no meaning shown)* | H |

**Figure 3.13 ENGINEERING COMMANDS**

*Note: the table's final line in the original shows only a lone "H" in the SHIP SECTION column with no corresponding device code or meaning text — reproduced here as it appears in the scan.*

### Medical Module

The medical module maintains the health status of all of the crew members. It keeps track of the number and status of its patients, the patient capacity of the medical stations, the medical personnel, the functional status of its intensive care units and other hardware.

While there is no operator input to the medical module, and hence no need for a medical officer, there is a display of the medical data. The only operator input to this module is indirectly through the communications officer. When crew members (not the actual operators) are found to be sick (diminishing health status) the communications officer sends them a message

<!-- page 39 -->

*Figure 3.14 ENGINEERING DISPLAYS: PRELIMINARY FUNCTIONAL DESIGNS — a screen mockup showing a schematic drawing of the turbo-elevator system (labeled "TURBO-ELEVATOR") with two elevator car diagrams shown in profile, plus the following labeled fields/boxes:*

- T/E CAR table with columns: STATUS (subdivided FUNC, OPER), DEST., LOC., NUMBER PSNGRS
- T/E TUBE table with columns: FUNC, OPER
- T/E COMPUTER box: OPSTAT, FUNCSTAT, REPAIR
- ALERTS (box)
- COMMAND (box)

<!-- page 40 -->

*Figure (uncaptioned in source scan) — a screen mockup showing schematic line-drawing views of the Enterprise from three angles, labeled TOP, PORT, and BOTTOM, each with a shaded quadrant/section indicating damage, plus the following labeled fields/boxes below the schematics:*

- PRIMARY DAMAGE table with columns: SECTION, STATUS (subdivided DAMAGE, REPAIR), ETR
- COMMANDS (box)
- ALERTS (box)

*Note: no figure number or caption text is visible on this page in the scan; based on context (following the Engineering section, preceding the Medical display) this appears to depict the ship structural damage report display.*

<!-- page 41 -->

to proceed to the intensive care unit. While they are there their health condition will improve (or worsen) depending upon the functional and operational status of the intensive care unit, the medical computer, and medical research laboratory, and the available energy. When, through the application of expert medical care, a patient recovers, he is sent to his assigned station (see figure 3.7).

*Figure 3.15 MEDICAL DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen mockup diagram with the following labeled fields/boxes:*

- Top heading: MEDICAL
- INTENSIVE CARE UNITS: four columns (units 1-4), each with a status gauge/meter at top, and rows: STATUS, NAME, RANK, UNIT (1/2/3/4), OPSTAT, FUNCSTAT, REPAIR
- Below each unit column: a small bar chart (three bars each)
- MEDICAL PERSONNEL box (large blank list area)
- COMPUTER box: OPSTAT, FUNCSTAT, REPAIR
- ALERT (box)
- COMMAND: (box)

### Helm

The helm module maintains the status of and provides the means of operating the offensive and defensive weapons.

For the phasers the spatial relationship between the Enterprise and the target is first determined by the module. This

<!-- page 43 -->

*Figure 3.17 HELM DISPLAY: PRELIMINARY FUNCTIONAL DESIGN — a screen mockup diagram with the following labeled fields/boxes:*

- PHASERS table with columns: NBR, OP, FUNC, REPAIR (six blank rows)
- TORPEDO table with columns: STA, NBR, OP, FUNC, REPAIR (four blank rows)
- SHIELDS table with columns: LOC, OP, FUNC, REPAIR; rows: FORE, AFT, PORT, STBD, TOP, BTM
- Below the SHIELDS table: a bar chart with grouped bars for each of FORE, AFT, PORT, STBD, TOP, BTM (three bars per group)
- ALERTS (box)
- COMMAND: (box)

---

*Editorial note on page ordering: the scanned page image files in this range are not in strict book-page-number order. File pg-045.png (this section's final image) is printed book page 43 (Figure 3.17, Helm Display). Book page 42 — which contains the Helm module's continued narrative text and the important Figure 3.16 HELM COMMANDS function/command-format table — was found instead in the image file pg-046.png, just outside the pg-031–pg-045 range assigned for this transcription. Because that command table is directly relevant to the Helm module's command syntax, it is included below for completeness, out of numeric file order, clearly marked.*

<!-- page 42 (found in image file pg-046.png, out of sequence) -->

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

### MAJOR FUNCTIONS INTERFACE

Each module in this simulation has access to a common data area. It is assumed that all modules reside in main memory and are executed sequentially under control of the Simulation Con-
