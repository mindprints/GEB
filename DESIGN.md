# GEB: Jump Out of the System — feasibility & alternatives

Prototype: open `index.html` in a browser (no build, no dependencies). WASD/arrows to move, step on a plate to apply an MIU rule, **J** to jump out of the system.

## Feasibility of the Gemini proposal

| Idea | Verdict | Notes |
|---|---|---|
| Three dimensions (Escher / Bach / Gödel) | Feasible, but scope-heavy | Each is a different game (non-Euclidean level design, time-loop recording, a logic sandbox). Build one vertical slice per dimension, not all at once. |
| Escher gravity-shifting rooms | Feasible | Well-trodden (Antichamber, Manifold Garden, Monument Valley). Per-surface gravity is easy; true impossible geometry needs portal tricks. |
| Bach "record and play back, inverted/reversed" | Feasible | Record input streams, replay with transforms (reverse = cancrizans, negate = inversion, offset = canon). Closest to Braid / The Talos Principle recorders. |
| MU-puzzle plates that morph into objects | Feasible, with a caveat | The MIU system is trivial to implement. **MU is provably unreachable from MI** (`#I mod 3` never hits 0). That is the point, not a bug, but Gemini's "rewrite the rules" fix is a cheat. See below. |
| "Jump Out of the System" camera pull-back | Feasible as a transition, weak as a mechanic | A button that always escapes any puzzle trivialises every puzzle. It needs a cost or a precondition. |
| Isomorphism vision | Feasible but the hardest to design | Needs every puzzle authored with a *real* second system mapping onto it. Cracks that "match a fugue" is art direction unless the mapping is computable. |
| Procedural canon / Canon per Tonos audio | Feasible | WebAudio is enough. Shepard-Risset glissando is ~30 lines. |
| Open-ended "chapters as nested layers" | Feasible and the strongest idea | Layer N+1 contains Layer N as an object. |

### Main design problem

Gemini's prototype resolves the dead end by letting the player edit the axiom to `MIII`. That makes the win condition "I found the button that changes the rules", which is the opposite of the book's lesson. In the book, stepping out means *reasoning about the system* and discovering the invariant. A good JOOTS mechanic should reward that insight.

## What the prototype does

- **Layer 0**: first-person raycaster corridor. Four plates apply the four MIU rules; the string is also a melody (M, I, U map to notes). The gate wants `MU`.
- **Dialogue**: Achilles and the Tortoise hint after N failed moves.
- **JOOTS**: the FPV frame shrinks into a picture on a page (Layer 1).
- **Layer 1** (proof-gated, alternative 1 below): the Isomorphism Lens measures every derivable string (about 1,590 at depth 7) without naming the law. The player then submits a claimed invariant. The game checks it against the axiom, every rule applied to all strings of the form `M[IU]*` up to length 9, and MU, and returns a concrete counterexample if it fails. Only an accepted proof unlocks the quill (axiom editor), so editing the axiom is a consequence of understanding, not a shortcut.
- Verified headlessly: rule application, the enumeration (MU absent from `MI`, present from `MIII`), the layer transitions, and no console errors.

Known prototype limits: rules III/IV act on the leftmost match only in the FPV; the proof checker is exhaustive only up to length 9 (enough for these claims, not a general theorem prover); the claim list is a fixed menu rather than free-form.

## Alternatives worth considering

1. **Invariant-gated JOOTS (implemented).** Jumping out (J) is always available, but the quill that rewrites the axiom only unlocks once the player has *submitted a proof*: pick a claimed invariant from a fixed menu (`#I` odd, `#I` never a multiple of 3, `#U` even, ...). The game checks it against the axiom, MU, and every rule applied to all `M[IU]*` strings up to length 9. Wrong claim: a concrete counterexample. Right claim: the quill unlocks. This keeps the core insight and is cheap to verify by brute force.
2. **Solvable-from-inside variant.** Use the book's other systems (the pq-system, the Tortoise's "Typographical Number Theory" fragments). A pq-system puzzle is *solvable* and teaches isomorphism: `-p--q---` is "2+1=3". Pair a solvable system with an unsolvable one so the player learns when to stop.
3. **Layer as object, not camera.** Each layer is a physical toy in the layer above (a diorama on a desk). JOOTS becomes picking the room up. Rendering stays simple: one extra camera and a render texture.
4. **Bach slice first.** The most gameplay per engineering hour: a recorder that plays your moves as reversed / inverted / augmented voices, with platforms driven by a fugue subject. Closest to a shippable core loop.
5. **Dialogue-driven structure.** Make each Achilles/Tortoise dialogue a level whose structure mirrors the dialogue (the "Crab Canon" is literally a palindrome corridor you walk forward and back).

## Suggested path

1. Keep this MIU slice; swap the axiom editor for the proof-by-lens gate (alternative 1).
2. Add a pq-system room beside it (alternative 2) to teach isomorphism on a solvable system.
3. Build one Bach recorder room (alternative 4).
4. Only then decide whether the Escher dimension is worth a 3D engine (Three.js/Godot) or stays as authored portal tricks.
