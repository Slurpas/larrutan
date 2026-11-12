# Maths plan: the town of maths

Status 2026-11-12: **the order is agreed; each game is still reviewed as a sketch before it is built.** Only Räkna frukterna and Gräsklipparen exist. The themes are the user's to change, and three questions in §9 are open.

The user asked (2026-11-12) for a check of the maths games, and a plan that does for maths what the town of letters does for reading: well thought through games that scale, teach, and make a child want to start and keep going.

**The user's answer the same day:** the children can say the numbers in order, but may not be able to count things. So the ladder now starts one step lower, with a game for counting things (**Äppelträdet**), before amounts and digits (Talkorgarna). The user said yes to this, and to fixing Gräsklipparen first (Task 39).

## 1. The check: maths as it is today

**What there is.** Two games, both adding and taking away up to 10:

| Game | What the child does | Levels |
|---|---|---|
| Räkna frukterna | Counts two kinds of fruit and taps the total | The sum under the fruit shows less and less: "7 + 1 = 8", then "7 + 1 = ?", then "7 + ? = ?", then only the fruit |
| Gräsklipparen | Mows a lawn; sums hide in the grass | Plus to 5 with dots, plus to 10 with dots, without dots, then minus too (changed in Task 39, finding 2) |

**What works.**
- Räkna frukterna is a sound teaching game: the fruit stands in rows of five, the written sum fades step by step, the numbers to choose from are close to the answer, and after a wrong tap the fruit counts itself.
- Gräsklipparen is a toy first, and the children wanted to play it. That is worth keeping as the rule for every new game.
- Both use the same rounds, levels, memory of what is hard, and rewards as the letter games, so a new maths game costs a round builder and a screen, not a new system.

**What to fix.**

| # | Finding | How I know | Fix |
|---|---|---|---|
| 1 | Gräsklipparen says "Under blommorna gömmer sig tal", but since 2026-10-27 the flowers are random and mark nothing | `phrases.mowerIntro` | "I gräset gömmer sig tal." Free now: the sentence is still Alma's, so nothing made by ElevenLabs is thrown away. **Fixed, Task 39** |
| 2 | Minus first appears at the top level as bare digits ("5 − 3 = ?"). Plus got dots to count; minus never does | Screenshot of level 4 | Minus arrives one level earlier, with dots where the ones taken away are crossed out; the dots go at level 4. The level sentences already exist. **Fixed, Task 39** |
| 3 | Maths starts at "3 + 4". There is nothing for the steps before it (amounts, digits, order, comparing, splitting numbers) or after it (past 10, tens) | The levels in `levels.ts` | The plan below |
| 4 | Zero never appears, and no number is above 10 | `numbers.ts` | The plan below |
| 5 | Gräsklipparen gives 3 to 5 sums for 40 squares of mowing. Fine for the treat it is, but it cannot be the main practice | Level table | Leave it; the new games carry the practice |
| 6 | **On a phone the level bar lies over the top row of signs.** Gräsklipparen's sign is under it, and in the town of letters Sortera korten's and Första bokstaven's. They can hardly be tapped | Measured at the iPhone 13's size (750×342): bar at y 29–79, signs at y 57 | Its own small task, if the children play on a phone (§9) |
| 7 | On a phone Räkna frukterna's number cards are cut off at the bottom | Screenshot at 750×342 | Same task as 6 |
| 8 | All 32 maths sentences are still said by Alma | Task 34 | About 400 credits, when the user says so |

Checked by reading the rules and by screenshots of every level of Räkna frukterna and levels 1 and 4 of Gräsklipparen in iPad WebKit, and of level 4 and the town at phone size. Not checked on a real device.

## 2. What the town should teach

A ladder, each step resting on the one below. It follows the order Swedish schools use in förskoleklass and year 1. As far as I know Lgr22 (amounts and order, splitting numbers, the place-value system, the four operations, patterns, doubles and halves, time, money) the steps are all in it, but I have not checked this plan line by line against Skolverket's text.

| Step | In Swedish | The child can… | Game |
|---|---|---|---|
| 1 | Räkna saker | count things: one number for each thing, and the last number said is how many | **Äppelträdet** (new) |
| 2 | Antal och siffror | see how many without counting each one, and match amount, digit and word | **Talkorgarna** (new) |
| 3 | Talraden | say what comes next and before, fill a gap, count in twos, fives and tens | **Grodhoppet** (new) |
| 4 | Jämföra | say which is more, fewer, largest, smallest, the same | **Krokodilen** (new) |
| 5 | Dela upp tal | split a number in two; know the pairs that make 5 and 10 (tiokamrater) | **Äggkartongen** (new) |
| 6 | Plus och minus till 10 | add and take away, first by counting, then from memory | Räkna frukterna, Gräsklipparen |
| 7 | Tiotal och ental | read and build numbers to 100 from tens and ones; pay with coins | **Affären** (new) |
| Later | Mönster, dubbelt och hälften, plus och minus till 20, klockan, former | | §4, "Later" |

Steps 1 to 5 are what is missing most.

**Step 1 is not the same as saying the numbers.** A child who can say "ett, två, tre…" to twenty may still not be able to answer "how many?". Counting things takes two more skills: giving each thing exactly one number (none skipped, none counted twice), and knowing that the last number said is the answer. The hardest form is making an amount: "give me six" from a bigger heap, where the child must stop in time. Äppelträdet practises all three.

A child who knows that 7 is 5 and 2, and that 7 needs 3 to make 10, adds without counting on fingers; a child who does not is stuck counting. That is why the tiokamrater get a game of their own.

## 3. How every maths game is built

1. **A toy first.** Each game has one thing that is fun to do (mow, hop, feed, pay). The maths is what makes the toy work. Gräsklipparen showed this is what brings the children back.
2. **Right is fun, wrong is dull.** The frog's hop and the hen's eggs come with the right answer. A wrong answer is greyed out and named, nothing more. (If the frog fell in the water for a wrong answer, wrong would be the fun one.)
3. **One number, three forms:** the amount, the digit, the spoken word. Every game ties at least two together, and a tapped number is said aloud.
4. **From things, to pictures, to digits.** Level 1 has things to count, the middle levels have pictures with structure, level 4 has digits only. Räkna frukterna already does this.
5. **Fives and tens, not heaps.** Amounts stand in rows of five, in an egg carton of ten, as dice or as fingers, so the child learns to see "5 and 2" instead of counting from one.
6. **Help that teaches.** After a wrong tap the picture shows why: the things count themselves, the lid lifts, the dots appear. The existing help (greyed out, then the answer pointed at) stays underneath.
7. **Short rounds, many answers.** About five to seven answers a round, a minute or two. No clock, no lives.
8. **Little talk.** One instruction the first time, a short one after, numbers named, praise as sounds.

## 4. The games

Every game has four levels, moved by the same rule as now (two good rounds go up, two poor ones go down), and remembers what was hard, item by item, so it comes back more often.

### Äppelträdet (step 1: counting things) — working name

- **Teaches:** counting things one by one, that the last number is how many, and making an amount that is asked for.
- **Plays like:** an apple tree and a basket. The child taps an apple; it drops into the basket and the game says the next number ("Ett. Två. Tre."). A picked apple is gone from the tree, so it can't be counted twice, and none can be skipped, because the round goes on until the tree is empty. Then "Hur många?", and the child taps the digit. In the basket the apples lie in rows of five.
- **After a wrong number:** the apples in the basket count themselves, one at a time, as the fruit does in Räkna frukterna.

| Level | What the child does |
|---|---|
| 1 | Picks 1–5 apples, counted aloud, then taps how many |
| 2 | The same with 1–10 |
| 3 | The apples already lie in the basket, in rows of five; the child taps how many without picking them (touching an apple still counts it, as help) |
| 4 | "Plocka sex äpplen!": more apples on the tree than asked for. The child picks, and taps the basket when it is enough. Too many or too few: the basket counts its apples, and the child tries again |

- **Remembers:** each number.
- **Built from:** the shared round and Räkna frukterna's number cards and counting help. New: the tree, the basket, the falling apple. **Size: small to medium.**
- **Speech:** the counting uses the numbers that already exist ("Ett.", "Två."). New: the question, its short form, three level sentences, and "Plocka … äpplen!" for 1 to 10.

### Talkorgarna (step 2: amounts and digits)

- **Teaches:** that ●●●●● ●●, "7" and "sju" are the same number.
- **Plays like:** Bokstavskorgarna. Each basket has a digit; the cards show amounts; the child puts each card in its basket, and the number is said when it lands.
- **The cards:** dice dots, fruit, fingers, eggs in a carton, dots in two colours (5 red and 2 yellow), and at level 4 a full ten and some more. All drawn by code.

| Level | Numbers | Baskets | New |
|---|---|---|---|
| 1 | 1–5 | 3 | Dice dots and fruit, every card showing |
| 2 | 1–10 | 3 | Fingers and egg cartons; cards in piles |
| 3 | 0–10 | 4, with numbers next to each other (6, 7, 8, 9) | Scattered dots that must be counted; zero as an empty card |
| 4 | 11–20 | 4 | A full ten and some more: the first look at tens and ones |

- **Remembers:** each number.
- **Built from:** Bokstavskorgarna's rules, screen and tests, with number sets in place of letter sets. **Size: small.**

### Äggkartongen (step 5: splitting numbers, tiokamrater)

- **Teaches:** the pairs that make 5 and 10, and how other numbers split.
- **Plays like:** Räkna frukterna's screen. An egg carton with some eggs in it: "Hur många ägg fattas?" The child taps the number, and the hen lays the missing eggs one at a time, counted aloud, and the lid closes.

| Level | The carton | What shows |
|---|---|---|
| 1 | 5 holes, one row (femkamrater) | The empty holes: count them |
| 2 | 10 holes, two rows of five | The empty holes |
| 3 | 10 holes | A cloth hides the empty holes: 7 eggs show, the child must know 3. A wrong tap lifts the cloth |
| 4 | None | Digits: "7 + ? = 10", "10 − 7 = ?", and other numbers ("8 = 5 + ?") |

- **Remembers:** each pair (7 and 3).
- **Built from:** the card screen with a scene, as Räkna frukterna. New: the carton, the hen, the eggs. **Size: small to medium.**

### Grodhoppet (step 3: the number line)

- **Teaches:** the order of the numbers, forwards and backwards, and counting in steps.
- **Plays like:** a frog crossing the pond on lily pads. The pads behind it keep their numbers, so a number line grows across the water. Three or four pads ahead have numbers: "Vilket tal kommer sen?" The right pad is a hop and a croak; six hops reach the other bank and a fly.

| Level | The hops |
|---|---|
| 1 | Forwards, 1 to 10 |
| 2 | Forwards and backwards, 0 to 20 ("Vilket tal kommer före?") |
| 3 | The gap ("6, ?, 8"), and two at a time, up to 20 |
| 4 | In twos to 20, in fives to 50, in tens to 100 |

- **Remembers:** each step ("after 7", "before 12", "tens: after 40").
- **Built from:** the shared round (`useChoiceRound`) with its own scene, like Mata draken. **Size: medium.**

### Krokodilen (step 4: comparing)

- **Teaches:** more and fewer, largest and smallest, the same; at the end the signs < > =.
- **Plays like:** a hungry crocodile in the pond and rafts with fish: "Var är det flest?" It swims to the raft the child taps and snaps. Its open mouth is the sign >, a picture many Swedish teachers use (the crocodile eats the largest).

| Level | The rafts |
|---|---|
| 1 | Two heaps of 1–5 fish, clearly different: most |
| 2 | Heaps of 1–10 that may differ by one; most or fewest; sometimes three rafts |
| 3 | Digits 0–20, three numbers: largest or smallest |
| 4 | Digits to 100 ("34 or 43?"), the mouth shown as < and >, and rounds where two are the same |

- **Remembers:** pairs of numbers, close ones most.
- **Built from:** the shared round with its own scene. **Size: medium.**

### Affären (step 7: tens and ones, money)

- **Teaches:** building a number from tens, fives and ones.
- **Plays like:** a shop. A thing with a price tag, a purse of coins; the child drags coins onto the counter and presses "Betala". The till rings when it is exact. No choices to guess between: the child builds the answer.

| Level | Prices | Coins |
|---|---|---|
| 1 | 1–5 kr | 1 kr: count them out |
| 2 | 1–10 kr | 5 kr and 1 kr (7 is 5 and 2) |
| 3 | 11–50 kr | 10 kr and 1 kr, then 5 kr too |
| 4 | Up to 100 kr | All three, and the sum on the counter is no longer shown |

- **Remembers:** kinds of price (under 5, 6–9, teens, whole tens, tens and ones).
- **Built from:** new rules and screen; the dragging is as in the card games. **Size: large.**

### The two that exist

- **Räkna frukterna:** stays as it is.
- **Gräsklipparen:** findings 1 and 2 above, fixed in Task 39. Its levels are now: plus to 5 with dots, plus to 10 with dots, minus too (with dots, the ones taken away crossed out), then no dots.

### Later (each small to medium, not scheduled)

- **Pärlbandet** (patterns): a string of beads, which bead comes next. AB, AAB, ABC, a missing bead in the middle. No numbers, good for the youngest.
- **Dubbelt och hälften:** a ladybird with the same dots on both wings (doubles); sharing between two plates (halves).
- **Plus och minus till 20:** two egg cartons, to show 8 + 5 as "fill the ten, three over".
- **Klockan:** whole and half hours.
- **Former:** circles, squares, triangles and rectangles in Sortera korten's game.

## 5. Why a child keeps going

- **The games themselves**, first of all (§3, points 1 and 2).
- **Everything that works now stays:** XP, the wardrobe, sounds for praise, levels that rise and fall quietly.
- **New: stars on the signs.** A star for each level of a game the child has finished, up to four, in both towns. It shows what is done and what is left, and it never goes down. Small to build.
- **New: one thing to wear from each maths game** (a frog hat from Grodhoppet, and so on), for finishing its level 2, and a rare one for knowing all the tiokamrater. Each needs its art and two spoken sentences.
- **Later, maybe: a bridge in the world** that gets a plank for each star, to a place that opens when it is whole. On the roadmap already as "Bron"; not planned here.

## 6. How it scales

- **A new game is a round builder and a screen.** Levels, scores with guessing taken out, the rule for going up and down, what is remembered, XP and items are shared and already tested.
- **A level is a row of numbers** in `levels.ts` (how high, how many, what shows), so tuning after a playtest is one line.
- **Hard things come back.** Every game names what it practises ("7 and 3", "after 12"), so the existing memory favours what the child gets wrong.
- **Room to grow upwards.** The top levels of Grodhoppet, Krokodilen and Affären reach 100, which is year 1 and 2. If a child outgrows four levels, a fifth is a new row.
- **Room in the town.** The town of maths has room for seven signs, as the town of letters has. With Äppelträdet the plan has eight games (the two that exist and six new), so the last one built (Affären) needs the town drawn a little bigger, as part of its task. The "later" games need a second maths place.

## 7. Speech and credits

Everything new is said by Alma for free until the user gives credits, as now (Task 31).

| What | Sentences | Credits, about |
|---|---|---|
| Waiting already: the 32 maths sentences | 32 | 400 |
| Zero and 11–20, alone ("Elva.") and pointed at ("Här är elva!") | 22 | 250 |
| The tens 30–100, alone | 8 | 70 |
| Each new game: a question, its short form, three level sentences | 6–8 each | 100–150 each |
| Äppelträdet's "Plocka … äpplen!", 1 to 10 | 10 | 200 |
| **All of this plan** | about 115 | **about 1,700** |

Above 20 only the whole tens are said; other numbers are read, which by then is the skill.

## 8. The order to build

One task at a time, each stopped for review, each starting with a sketch of the screen for the user to approve.

| # | Task | Size | Why here |
|---|---|---|---|
| 39 | Gräsklipparen: the right first sentence, and minus with dots | Small | Fixes what is wrong today, costs nothing. **Done 2026-11-12** |
| 40 | The map and the games on a phone (findings 6 and 7) | Small | Only if the children play on a phone; waits for the user's answer, and the games below don't wait for it |
| 41 | Äppelträdet | Small–medium | The first rung: counting things (the user, 2026-11-12) |
| 42 | Talkorgarna | Small | The second rung, and the cheapest game |
| 43 | Grodhoppet | Medium | |
| 44 | Krokodilen | Medium | |
| 45 | Äggkartongen | Small–medium | The most valuable rung for year 1 |
| 46 | Stars on the signs, and things to wear from the maths games | Small–medium | When there are enough games to collect |
| 47 | Affären | Large | The oldest child's game |

## 9. For the user to decide

1. ~~**Where are your children now?**~~ Answered 2026-11-12: they can say the numbers, maybe not count things. Äppelträdet first, then the ladder in order. A minute at the table tells more: put seven things down and ask "how many?", then ask "give me four".
2. **Do the children play on a phone,** or is the iPhone only for your own testing? That decides Task 40.
3. **The themes:** an apple tree, baskets, a frog, a crocodile, a hen and an egg carton, a shop. Any to swap?
4. **Stars on the signs:** yes or no?
5. **Credits:** make the maths voice now (about 400), or wait and make it all at once?
