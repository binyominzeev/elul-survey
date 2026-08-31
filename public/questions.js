// Az Elul Self-Awareness 40 kérdőív 40 állítása.
const QUESTIONS = [
  "Ha valaki olyan álláspontot képvisel, amellyel nem ért egyet, képes valóban megérteni, hogyan jutott el az illető arra az álláspontra.",
  "Ha valamit megígér, mások általában számíthatnak rá, hogy meg is teszi.",
  "Ha egy számára fontos helyzetben nem ő irányítja a dolgokat, nehezen engedi el a kontrollt.",
  "Ha kritikát kap, képes először megérteni a kritikát, mielőtt védeni kezdené magát.",
  "Fontos számára, hogy mások kompetensnek és hozzáértőnek lássák.",
  "Döntéseiben rendszerint figyelembe veszi, hogy azok hogyan érintik a körülötte lévő embereket.",
  "Stresszes helyzetben is képes úgy viselkedni, hogy az első érzelmi reakciója ne irányítsa teljesen a viselkedését.",
  "Ha valamihez jelentős munkát tett hozzá, számít neki, hogy ezt mások is észrevegyék.",
  "Ha egy közösen kialakított tervet valaki más jelentősen megváltoztat, viszonylag könnyen alkalmazkodik.",
  "Ha új információ ellentmond annak, amit korábban gondolt, hajlandó módosítani a véleményét.",
  "Általában észreveszi, ha valakinek a környezetében segítségre vagy figyelemre van szüksége.",
  "Ha valamit elkezd, akkor is igyekszik végigvinni, amikor az első lelkesedése már elmúlt.",
  "Ha valami felzaklatja, viszonylag gyorsan vissza tud térni egy kiegyensúlyozott állapotba.",
  "Ha valamiben határozottan hisz, hajlamos kevés figyelmet fordítani arra, hogy mások hogyan látják ugyanazt a helyzetet.",
  "Általában bízik abban, hogy képes megoldani az előtte álló nehéz feladatokat.",
  "Csoporthelyzetekben gyakran természetesen kerül olyan szerepbe, ahol ő kezdeményez vagy irányít.",
  "Ha rájön, hogy valamiben tévedett, általában képes ezt mások előtt is elismerni.",
  "Emlékszik mások számára fontos személyes részletekre, és később is vissza tud térni ezekre.",
  "Hajlamos több dolgot vállalni, mint amennyit reálisan végig tud vinni.",
  "Mások sikere időnként csökkenti a saját teljesítményével való elégedettségét.",
  "Ha mások nem úgy csinálják a dolgokat, ahogyan ő helyesnek tartja, ezt nehezen viseli.",
  "Ha megbízható embertől olyan visszajelzést kap, amely ellentmond az önmagáról alkotott képének, komolyan megvizsgálja azt.",
  "Ha valamiben nem ért egyet valakivel, képes úgy képviselni a saját álláspontját, hogy közben a másik fél szempontját is komolyan veszi.",
  "Feszültség alatt is általában megőrzi a másokkal szembeni türelmét.",
  "Képes másokra rábízni olyan feladatokat is, amelyeket ő maga másképpen csinálna.",
  "Kifejezetten kevéssé érdekli, hogy mások mennyire tartják sikeresnek vagy kompetensnek.",
  "Ha valaki más érvelése valamiben erősebb, mint az övé, képes ezt felismerni és elismerni.",
  "Az emberek általában úgy érzik mellette, hogy a véleményük és szempontjaik számítanak.",
  "Ha valami nagyon felbosszantja, az érzelmei gyakran még akkor is meghatározzák a viselkedését, amikor már tudja, hogy nem kellene.",
  "Ha fontosnak tart valamit, képes egyértelműen képviselni az álláspontját akkor is, ha mások nem értenek vele egyet.",
  "Másokért gyakran tesz olyan apró dolgokat, amelyeket azok nem kértek tőle.",
  "Ha hibázik, attól még nem kérdőjelezi meg alapvetően a saját kompetenciáját.",
  "Ha már kialakított egy véleményt egy kérdésben, nehezen engedi, hogy új szempontok érdemben megváltoztassák azt.",
  "Mások számára általában kiszámítható abban, hogy betartja a vállalásait.",
  "Ha valaki lassabban halad, mint ahogy ő természetesnek tartaná, általában képes türelmes maradni.",
  "Ha kritikát kap, hajlamos először azt keresni, hogy miért nincs igaza a másiknak.",
  "Képes vállalni a véleményét akkor is, ha tudja, hogy mások esetleg nem fognak egyetérteni vele.",
  "Annyira leköti a saját feladata vagy gondolkodása, hogy időnként észre sem veszi, mire lenne szükségük a körülötte lévőknek.",
  "Mások elismerése nélkül is viszonylag stabilan fenn tudja tartani a saját értékességébe és képességeibe vetett bizalmát.",
  "Ha jelentős felelősséget vállal, akkor is igyekszik megbízhatóan teljesíteni, amikor ez már kényelmetlen vagy nehéz számára.",
];

const RELATIONSHIP_OPTIONS = [
  "családtag",
  "közeli barát",
  "barát / ismerős",
  "munkatárs",
  "szakmai kapcsolat",
  "közösségi kapcsolat",
  "tanítvány / mentorált",
  "egyéb",
];

const DURATION_OPTIONS = [
  "kevesebb mint 1 éve",
  "1–3 éve",
  "3–5 éve",
  "5–10 éve",
  "több mint 10 éve",
];

const FREQUENCY_OPTIONS = ["ritkán", "havonta néhányszor", "hetente", "naponta / majdnem naponta"];

const OPEN_QUESTIONS = [
  {
    id: "q41",
    text: "Mi az a tulajdonsága vagy viselkedése, amelyet szerinted saját magán kevésbé vesz észre, mint amennyire mások észreveszik?",
  },
  {
    id: "q42",
    text: "Mi az a tulajdonsága, amelyet szerinted hajlamos túlbecsülni vagy túl pozitívan látni magában?",
  },
  {
    id: "q43",
    text: "Mi az a dolog, amit szerinted nagyon jól csinál, de valószínűleg ő maga nem tulajdonít neki elég jelentőséget?",
  },
];
