/* ===== HUNTER EXAM ENGINE ===== */
const ATTRS = [
  ['strength','Strength','Physical'],['speed','Speed','Physical'],['endurance','Endurance','Physical'],['agility','Agility','Physical'],
  ['intelligence','Intelligence','Mental'],['perception','Perception','Mental'],['strategy','Strategy','Mental'],
  ['determination','Determination','Psychological'],['courage','Courage','Psychological'],
  ['charisma','Charisma','Social'],['teamwork','Teamwork','Social'],
  ['combat','Combat Skill','Specialized']
];
const ATTR_LABEL = Object.fromEntries(ATTRS.map(a => [a[0], a[1]]));

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function makeRng(seed){
  const r = mulberry32(seed >>> 0);
  r.int = (a,b) => a + Math.floor(r()*(b-a+1));
  r.pick = arr => arr[Math.floor(r()*arr.length)];
  r.gauss = (m=0,s=1) => { let u=0; while(u===0) u=r(); const v=r(); return m + s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  r.shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  return r;
}
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
function ordinal(n){ const s=n%100; if(s>=11&&s<=13) return n+'th'; return n+({1:'st',2:'nd',3:'rd'}[n%10]||'th'); }

/* ---------- Names ---------- */
const FIRST_M = ['Kael','Darius','Akira','Elias','Lucien','Renji','Cassian','Theo','Orin','Matteo','Haruto','Ivo','Rafael','Soren','Bastian','Kenzo','Idris','Tomas','Anselm','Jiro','Malik','Viktor','Ezra','Dorian','Rune','Silas','Kofi','Yusuf','Leandro','Arvid','Tobias','Ren','Hector','Nikolai','Emre','Caio','Joaquim','Ludo','Fenwick','Baltazar','Oskar','Teo','Zane','Amir','Kaito','Bram','Lior','Dante','Aaron','Abel','Adrian','Afonso','Ahmed','Aiden','Alaric','Alban','Albert','Aldo','Alejandro','Aleksei','Alexei','Alfie','Alistair','Amadeo','Ambrose','Anders','Andrei','Angus','Ansel','Anton','Apollo','Aram','Archer','Arjun','Armand','Arne','Arthur','Arturo','Asher','Aske','Atlas','Augustin','Aurelio','Axel','Aziz','Baird','Balthus','Barnaby','Basil','Bao','Beck','Benedikt','Bento','Bertram','Bjorn','Blaise','Bodhi','Bogdan','Boris','Bruno','Cael','Callum','Calvin','Camilo','Casimir','Cato','Cedric','Cesar','Chen','Cillian','Ciro','Clement','Colm','Conrad','Corin','Cosimo','Cyrus','Daisuke','Dalibor','Damien','Daniel','Dario','Davor','Declan','Deniz','Desmond','Diego','Dimitri','Domingo','Duarte','Eamon','Edgar','Edmund','Eero','Einar','Eitan','Elio','Emeric','Emil','Enzo','Eoin','Ephraim','Erasmo','Erik','Ernesto','Esteban','Ettore','Evander','Ewan','Fabian','Farid','Felix','Ferran','Filip','Finn','Florian','Francisco','Frederik','Gael','Gaspard','Gavril','Gennaro','Gideon','Gil','Giorgio','Goran','Gregor','Griffin','Gunnar','Gustavo','Hakim','Hamish','Hans','Harald','Haroun','Hassan','Henrik','Hiro','Horatio','Hugo','Ian','Ibrahim','Ignacio','Ilya','Imre','Ingo','Isak','Ismael','Ivan','Jace','Jakob','Jalen','Janek','Jasper','Javier','Jens','Jerome','Joao','Jonah','Jorge','Jose','Jovan','Julian','Jun','Juno','Jurgen','Kai','Kamil','Karan','Kasper','Keir','Kenji','Kian','Kiril','Klaus','Koa','Konrad','Kwame','Laszlo','Lazar','Leif','Leon','Leopold','Levi','Linus','Lorcan','Lorenzo','Luca','Lucas','Luis','Lukas','Magnus','Manu','Marco','Marek','Mario','Marius','Mateus','Mathis','Mattias','Maxim','Mehmet','Micah','Mikael','Milan','Milo','Mirko','Moritz','Mustafa','Nadir','Naoki','Nathaniel','Nico','Niels','Noah','Noel','Nuno','Octavian','Odin','Olav','Oliver','Omar','Orlando','Osamu','Osric','Otto','Pablo','Pascal','Pavel','Pedro','Percival','Pieter','Piotr','Quentin','Quillon','Radek','Rahim','Raiden','Ramon','Raoul','Rasmus','Raul','Reza','Rhys','Rico','Roald','Robin','Rodrigo','Roman','Ronan','Rory','Ruben','Rui','Ryo','Ryuji','Sacha','Salvador','Samir','Sandor','Santiago','Sebastian','Sergei','Seth','Shiro','Sigurd','Simon','Sindri','Stefan','Stellan','Sven','Tadeo','Takeshi','Tariq','Teodor','Thiago','Thorne','Tiago','Tibor','Timur','Tristan','Ulrich','Umar','Urban','Uriel','Vadim','Valentin','Vasco','Vidar','Vincent','Vitor','Wade','Walter','Wendell','Wilhelm','Xander','Xavier','Yannick','Yaroslav','Yasir','Yoshi','Yuri','Zac','Zakir','Zoltan','Abram','Achille','Adem','Adil','Agustin','Akim','Alder','Aleks','Alvar','Alvaro','Amos','Andor','Anwar','Ari','Aris','Arlo','Aurel','Avi','Bartek','Beno','Bilal','Borja','Brandt','Caspian','Cian','Colton','Cormac','Cruz','Dag','Dmitri','Dov','Edvard','Efrain','Elan','Eldon','Elric','Emrys','Enoch','Erol','Esben','Estevan','Ezio','Faris','Fausto','Fennick','Florin','Gabor','Gareth','Gaston','Halvard','Hanno','Haskel','Henri','Ilias','Ilan','Ingmar','Ishaan','Ivar','Jael','Jaro','Jory','Kalani','Kamal','Kazimir','Kemal','Kenta','Kester','Kirill','Kobe','Lasse','Lennart','Lev','Lowen','Lyle','Mads','Makoto','Marlon','Massimo','Mattheo','Merrick','Mikhail','Mischa','Nael','Nevio','Nils','Obi','Okan','Olek','Orrin','Osman','Ottavio','Paolo','Pell','Quinn','Radomir','Rafferty','Ragnar','Reinhold','Remy','Rolan','Rufus','Saul','Seamus','Severin','Shun','Sorin','Tamas','Taro','Thaddeus','Tor','Torben','Ugo','Ulf','Valerio','Varian','Vesper','Wim','Yared','Yoav','Zeno','Zoran','Kazuo','Masato','Hideo','Ryota','Sora','Takumi','Yuto','Hayato','Daichi','Kosuke','Mateo','Emiliano','Joaquin','Rocco','Fiore','Benedetto','Lazzaro','Corrado','Raffael','Bosco','Ilario','Tarik','Selim','Kaan','Berk','Arda','Onur','Volkan','Cem','Adnan','Zayd','Hamza','Rayan','Faisal','Nabil','Aarav','Abdiel','Adebayo','Ahmet','Aidan','Akin','Albin','Alejo','Alessio','Alim','Alois','Amadou','Anatol','Ansgar','Ardan','Armin','Arno','Atticus','Augusto','Ayaan','Balthazar','Benicio','Bertil','Bjarne','Boaz','Brennan','Caius','Calder','Cemal','Chidi','Cirilo','Conor','Cosmo','Cyprian','Dalton','Damian','Dashiell','Davit','Deacon','Dimas','Duncan','Eldar','Ellery','Emeka','Erasmus','Ercan','Fadil','Farouk','Felipe','Fenris','Ferdinand','Fintan','Fyodor','Gedeon','Giulio','Grigor','Hakon','Hiroshi','Jakub','Jalil','Jarek','Jensen','Jonas','Jorund','Joven','Julius','Kalev','Kasimir','Keanu','Kendrick','Kestrel','Khalid','Kiran','Kristof','Lars','Lazlo','Lennox','Levan','Lucan','Ludovic','Luka','Lysander','Mahir','Makoa','Malachi','Manfred','Matthias','Milos','Mordecai','Musa','Niklas','Nnamdi','Oberon','Octavio','Okon','Omari','Perrin','Reinhard','Roderick','Rostam','Rurik','Sabir','Sebastien','Seraph','Thorsten','Tiberius','Torin','Tycho','Vasil','Vincenzo','Vitus','Yannis','Zaid','Haldor','Ignatius','Ottokar','Rainer','Tancredi','Wolfram','Corwin'];
const FIRST_F = ['Mireya','Nara','Selene','Yuna','Ines','Freya','Aiko','Talia','Odette','Saoirse','Lucía','Mei','Esme','Zora','Imani','Liesel','Noor','Ayla','Rhea','Kasumi','Anouk','Beatriz','Ilse','Tamsin','Vesna','Maren','Calla','Yara','Sakura','Oona','Leni','Thea','Amara','Kiri','Sol','Elodie','Hana','Marisol','Ingrid','Petra','Wren','Nia','Lyra','Asha','Rosalind','Dalia','Fumiko','Clio','Ada','Adele','Adriana','Agathe','Agnes','Aida','Ailsa','Aino','Alba','Alessia','Alexa','Alina','Alma','Alva','Amaia','Amalia','Amelie','Amira','Anais','Anja','Annika','Antonia','Arabella','Ariadne','Arwen','Astrid','Aurelia','Aurora','Ava','Aveline','Azra','Bela','Belen','Bianca','Brigid','Bronwen','Camila','Carmen','Cassia','Catalina','Cecily','Celeste','Chiara','Chloe','Cira','Claudia','Constance','Cora','Corinne','Dagny','Daphne','Daria','Delphine','Diana','Dilara','Dorota','Eda','Edda','Eira','Elena','Eliska','Elsa','Elva','Elvira','Emi','Emilia','Esra','Estelle','Ester','Eva','Evelina','Fabiola','Farah','Fatima','Fern','Fiona','Flavia','Flora','Francesca','Freja','Gaia','Gemma','Genevieve','Giada','Ginevra','Greta','Gwen','Hale','Hanne','Harriet','Hazel','Hedda','Helena','Helga','Hilde','Hiromi','Ida','Ilona','Imogen','Ingeborg','Irene','Iris','Isadora','Isla','Ivana','Jade','Jana','Johanna','Josefine','Judit','Julia','Juna','Juniper','Kaia','Kalina','Karin','Katja','Keiko','Kenna','Kira','Klara','Lara','Laila','Lea','Leila','Liv','Livia','Lorena','Lotte','Luana','Lucia','Luna','Mabel','Madoka','Maeve','Magda','Maia','Malin','Mara','Marguerite','Mariam','Marta','Matilde','Maya','Meera','Mila','Mina','Mira','Miriam','Misaki','Morgana','Nadia','Naomi','Natasha','Neve','Nika','Nina','Noa','Nora','Odile','Olga','Olivia','Ondine','Ophelia','Orla','Paloma','Paz','Pia','Priya','Rana','Raquel','Reina','Renata','Rin','Rosa','Rowan','Ruth','Sabine','Sadie','Salma','Samira','Sana','Sanne','Sara','Sasha','Seren','Signe','Silvia','Simone','Sina','Sofia','Solveig','Stella','Suki','Svea','Tala','Tamar','Tara','Tess','Tilde','Tova','Ulla','Una','Ursula','Valentina','Valeria','Vera','Veronika','Vida','Viola','Vivienne','Wanda','Willa','Xenia','Yasmin','Ylva','Yoko','Yume','Zadie','Zaina','Zelda','Zeynep','Zoe','Zuzana','Abigail','Adaeze','Aditi','Afra','Aglaia','Aiyana','Alessa','Aliya','Alondra','Amani','Ambra','Anahi','Anouska','Aoife','Aria','Ariana','Asuka','Ayaka','Ayumi','Belinda','Birgit','Blanca','Briar','Calista','Camille','Carina','Celine','Chiyo','Ciara','Dafne','Dalila','Delia','Desta','Dina','Ebba','Eleni','Elif','Elin','Elise','Eloise','Emine','Enya','Esperanza','Etta','Fabienne','Faye','Femke','Filippa','Fleur','Galina','Gisele','Grete','Guadalupe','Haruka','Hester','Hina','Honoka','Ilaria','Inka','Isolde','Itzel','Jolene','Kaede','Kamala','Karima','Katalin','Laia','Lavinia','Leocadia','Liana','Lidia','Lilia','Linnea','Lisette','Lumi','Maelle','Mafalda','Mai','Marit','Mathilde','Melis','Mette','Minerva','Mio','Nadine','Nanami','Nayeli','Nerea','Nilufar','Odalys','Olena','Orsolya','Pilar','Quinta','Rafaela','Raisa','Rania','Ravenna','Rebekka','Renske','Riya','Romy','Rosalie','Sabriye','Saga','Sanaa','Selin','Serafina','Shirin','Sigrid','Siobhan','Soraya','Talulah','Tamara','Tatiana','Teodora','Thora','Tuva','Ugne','Valka','Vanya','Vesta','Wilhelmina','Yesenia','Yrsa','Zainab','Zarina','Ziva','Akane','Chihiro','Emiko','Haruna','Hikari','Kanon','Kohana','Machiko','Mariko','Natsuki','Rei','Saki','Shiori','Tomoe','Yui','Sienna','Allegra','Benedetta','Carlotta','Donatella','Fiorella','Graziella','Lucrezia','Ornella','Rosaria','Asli','Defne','Ece','Ipek','Nehir','Ozlem','Sevgi','Leyla','Layla','Yasmina','Hiba','Nour','Rim','Dunya','Abena','Ama','Ayana','Chiamaka','Ebele','Folake','Imara','Kesi','Makena','Nala','Nkechi','Thandiwe','Zuri','Ngaio','Aroha','Kahurangi','Leilani','Malia','Noelani','Pema','Dolma','Ananya','Diya','Isha','Kavya','Nisha','Saanvi','Tanvi','Jiwoo','Minji','Seoyeon','Haeun','Xiu','Lan','Ling','Yan','Hui','Thao','Linh','Huong','Ngoc','Adelaide','Alicia','Amaya','Annelise','Ayasha','Blythe','Brisa','Carys','Clementine','Dorothea','Eilidh','Elowen','Evadne','Felicity','Fenna','Gloria','Henrietta','Jacinta','Kalinda','Laurel','Adela','Adelina','Agnieszka','Akosua','Alessandra','Alix','Anaïs','Anahita','Avani','Ayesha','Azadeh','Beatrix','Brunhild','Carmela','Cleo','Cordelia','Damaris','Elspeth','Emeline','Ena','Esin','Estella','Eugenie','Ezinne','Fiora','Florence','Gisela','Gwendolyn','Habiba','Hadassah','Halima','Hesper','Honora','Ileana','Iolanthe','Irina','Jelena','Jessamine','Jovana','Juliet','Junia','Keziah','Kseniya','Liesl','Liliana','Lorelei','Lucinda','Ludmila','Lydia','Margit','Matilda','Melisande','Mercedes','Mirela','Morwenna','Nadezhda','Nell','Nerys','Nikita','Ninon','Noemi','Nuria','Ofelia','Oriane','Ottilie','Penelope','Perpetua','Philippa','Ragna','Ramona','Roxana','Rukmini','Salome','Sanna','Saskia','Seraphine','Silvana','Sinead','Sorcha','Sunniva','Svetlana','Tindra','Viveka','Ysolde','Zara','Zofia','Zuleika','Agrafena','Bettina','Cosima','Drusilla','Eulalia','Felicitas','Gudrun','Hortensia','Jocasta','Kunigunde','Leontine','Melusine','Nephele','Pomona','Rosamund','Sidonie','Theodora','Venetia','Wenna','Yolanda','Zinaida','Brielle','Gwynne'];
const FIRST_N = ['Ash','Rowan','Sky','Quinn','Sage','Juno','Wren','Noa','Eden','Rio','Indigo','Haven','Ember','Onyx','Rain','Tal','Nao','Hikaru','Shay','Jules','Alexis','Ellis','Marlowe','Sunny','Lux','Cass','Emery','Finch','Gray','Hollis','Ira','Jesse','Kit','Lake','Mika','Pax','Reese','River','Sorrel','Teal','Vale','Winter','Zephyr','Ayo','Chidi','Dara','Kamari','Nur','Rumi','Shiloh','Xen','Yuki','Aoi','Hinata','Itsuki','Mizuki','Nagisa','Tsubasa','Aki','Ilo','Arin','Bex','Corin','Dorian','Ezra','Fen','Hale','Isa','Jory','Kel','Lane','Merit','Nev','Oli','Perrin','Rue','Sol','Tamsin','Umi','Vesper','Wynn','Yarrow','Zen','Adair','Blue','Cyan','Darcy','Echo','Fable','Glen','Harlow','Idris','Jade','Kirin','Lumi','Mars','Nyx','Oakley','Peregrine','Quill','Remy','Sparrow','Tenzin','Uri','Vanya','Ari','Arden','Aspen','Avery','Briar','Brook','Cael','Cairo','Cedar','Cove','Crow','Dale','Dune','Fallow','Flint','Frost','Harbor','Jem','Kai','Kestrel','Lark','Linden','Lior','Lumen','Marlo','Merritt','Moss','Nico','North','Oak','Ocean','Oden','Perry','Phoenix','Pike','Reed','Remi','Revel','Ridley','Robin','Sable','Salem','Scout','Story','Tam','Thorne','True','Umber','Wilde','Yael','Zinnia','Dov','Elm','Gale','Haze','Ilex','Jun','Orin','Pell','Rook','Tay','Vix'];
// pronouns: he/him for men, she/her for women, they/them for everyone else (with plural verbs)
const PRS = (() => {
  const mk = (they, them, their, theirs, self, pl) => ({they, them, their, theirs, themselves: self, They: they[0].toUpperCase() + they.slice(1), Their: their[0].toUpperCase() + their.slice(1), Them: them[0].toUpperCase() + them.slice(1), pl,
    s: pl ? '' : 's', es: pl ? '' : 'es', ies: pl ? 'y' : 'ies', are: pl ? 'are' : 'is', were: pl ? 'were' : 'was', have: pl ? 'have' : 'has', do: pl ? 'do' : 'does', re: pl ? "'re" : "'s", ve: pl ? "'ve" : "'s"});
  return {Male: mk('he', 'him', 'his', 'his', 'himself', false), Female: mk('she', 'her', 'her', 'hers', 'herself', false), x: mk('they', 'them', 'their', 'theirs', 'themselves', true)};
})();
const PR = c => PRS[c && c.gender] || PRS.x;
// fill {they} {them} {their} {s} {are}... tokens in a text fragment for one person
const pro = (t, c) => t && t.indexOf('{') >= 0 ? t.replace(/\{(\w+)\}/g, (m, k) => { const v = PR(c)[k]; return typeof v === 'string' ? v : m; }) : t;
const LAST = ['Vordain','Solven','Velmont','Hoshino','Thornwick','Velsin','Arkwell','Takamura','Vaelmont','Drayke','Kisaragi','Blackmere','Ashgrove','Moreau','Kuroda','Halloran','Esteves','Varga','Lindqvist','Okonkwo','Castellan','Ferreira','Nakamura','Rourke','Duval','Sato','Brandt','Kovač','Albrecht','Marchetti','Ironside','Quill','Fairbairn','Okafor','Tanizaki','Mendel','Szabo','Holloway','Riven','Calder','Amsel','Delacroix','Yamada','Strand','Vasquez','Grimaldi','Navarre','Oyelaran','Petrov','Kestrel','Wyndham','Aldana','Ravensworth','Sorensen','Iwata','Brennan','Marlowe','Dagher','Corvin','Halvorsen','Kaminski','Sterling','Yilmaz','Morimoto','Larkspur','Vidal','Ondaatje','Rask','Beaumont','Fenn','Torvald','Esposito','Hargreave','Mbeki','Ishida','Lacroix','Volkov','Quintero','Wexley','Adeyemi','Abarca','Acosta','Adler','Aguilar','Ahlberg','Akagi','Alarcon','Albescu','Alcott','Almeida','Altman','Amari','Andersson','Antal','Aoki','Aranda','Arbogast','Ardent','Arima','Asante','Ashby','Aspen','Atwood','Auclair','Avalos','Ayala','Azevedo','Babic','Baker','Balogun','Banerjee','Barbosa','Barlowe','Bastos','Becker','Bellamy','Benedetti','Bergstrom','Berisha','Bishara','Bjork','Blackwood','Blanchet','Bodo','Bonnaire','Borowski','Bosch','Bracken','Bravo','Brightwater','Brook','Brunner','Bucur','Caldera','Calloway','Camargo','Campos','Caradoc','Carmichael','Carvalho','Castillo','Cerny','Chao','Chandra','Chevalier','Cho','Cinder','Coelho','Colbert','Contreras','Corbin','Cordova','Costa','Crane','Crowther','Cruz','Dahl','Dalca','Darrow','Davenport','Decker','Dekker','Delgado','Demir','Desai','Devereux','Dias','Dobrev','Dorne','Draven','Drummond','Duarte','Dumont','Durand','Eberhardt','Ekwueme','Elden','Ellery','Emberly','Engel','Erikson','Evander','Everhart','Falk','Farrow','Faust','Fenwick','Ferro','Figueroa','Fischer','Flint','Fonseca','Forsythe','Fujita','Galvan','Garrido','Gauthier','Geller','Ghosh','Giordano','Glass','Goto','Granger','Graves','Greer','Gruber','Guerrero','Hakimi','Hale','Hamada','Harrow','Hart','Hasegawa','Haverford','Hawke','Hayashi','Heller','Hirano','Holm','Horvath','Huang','Hyland','Ibarra','Ikeda','Imai','Ingram','Ivanova','Jaeger','Jansen','Jarvik','Jovanovic','Kagawa','Kane','Karlsson','Kato','Keane','Keller','Khoury','Kimura','Kirov','Klein','Kobayashi','Kowalczyk','Krause','Kruger','Kwon','Lambert','Landry','Langford','Larsen','Leclerc','Lemaire','Leone','Lindgren','Locke','Lombardi','Lopes','Lowell','Lucero','Lund','Macedo','Madsen','Maeda','Magnusson','Maki','Maldonado','Marin','Matsuda','Mayer','Medina','Mercer','Merino','Meyer','Mirza','Mohan','Molnar','Montague','Moreno','Mori','Morrow','Mueller','Murakami','Nagai','Nash','Neumann','Nikolaidis','Noble','Nordin','Novak','Nunes','Oakes','Ogawa','Okada','Oliveira','Orlov','Ortega','Osei','Ota','Pacheco','Palmer','Pardo','Park','Pascal','Patel','Pavlov','Pellegrini','Pereira','Pike','Pinto','Popescu','Prescott','Quarles','Quinn','Radu','Ramires','Reyes','Rios','Rocha','Rossi','Rowe','Ruiz','Saito','Salazar','Santos','Sauer','Schulz','Sekar','Serrano','Shah','Shimizu','Silva','Sinclair','Sokolov','Sousa','Stavros','Stone','Suzuki','Tamura','Tavares','Teixeira','Thorne','Toivonen','Tran','Ueda','Vale','Valdez','Vance','Vega','Verhoeven','Vogel','Wagner','Wakefield','Watanabe','Weber','Whitlock','Winter','Wolfe','Yamamoto','Yoon','Zamora','Zeller','Zhou','Zimmerman','Abernathy','Achterberg','Adair','Aisling','Alcantara','Alder','Arden','Arroyo','Ashcroft','Aubert','Ballard','Barrow','Bertrand','Blackthorn','Bolton','Bramwell','Briggs','Calhoun','Cardenas','Carrow','Castaneda','Chalmers','Cheng','Ciobanu','Clayborne','Colville','Coppola','Crowley','Dalton','Dashwood','Deveraux','Draper','Dunmore','Easton','Elsworth','Esquivel','Fairfax','Falconer','Fallon','Farrell','Ferraro','Fleming','Fontaine','Galloway','Garner','Gentry','Gilchrist','Gonzaga','Grayson','Greaves','Hadley','Halstead','Harlan','Hawthorne','Hensley','Holbrook','Hollis','Huxley','Inoue','Jessup','Kavanagh','Kingsley','Lachance','Laird','Langley','Lockhart','Loxley','Mackenzie','Mallory','Mansfield','Marchand','Merriweather','Montero','Moncada','Nakashima','Nightingale','Northcott','Oakley','Oberlin','Ogilvie','Oyama','Pemberton','Penrose','Radcliffe','Ramsey','Redgrave','Rockwell','Rosales','Salvatierra','Sandoval','Saxon','Shelby','Silverstone','Stanton','Stroud','Sutherland','Takeda','Thackeray','Thistlewood','Tolliver','Valcourt','Vane','Vickers','Wainwright','Warrick','Westbrook','Whitmore','Winslow','Wolcott','Yardley','Zorin','Akande','Babatunde','Chukwu','Eze','Mensah','Nwosu','Obi','Owusu','Danjuma','Kariuki','Mutua','Njoroge','Abubakar','Haddad','Nasser','Saleh','Rahman','Qureshi','Siddiqui','Farouk','Bakr','Arslan','Kaya','Ozturk','Celik','Aydin','Alderwood','Andrade','Asuncion','Bakshi','Bellweather','Bhatt','Bonaventure','Bryce','Olsen','Aldersey','Ambrosi','Ardelean','Arkadi','Ashdown','Baptiste','Barzani','Belloc','Bertolli','Bollinger','Brandvold','Calderon','Castellanos','Cimino','Cortázar','Crawshaw','Dalgaard','Delacorte','Dimitrov','Ebbesen','Eriksen','Falkenrath','Galbraith','Garroway','Gerhardt','Goldwyn','Haldane','Hargrove','Hartigan','Hollister','Ingersoll','Ishikawa','Jankowski','Kalinowski','Kawamura','Kerensky','Lafayette','Laurent','Marchbanks','Mendoza','Montclair','Nakagawa','Ostrowski','Pellegrino','Quintanilla','Rasmussen','Rosenthal','Sagara','Salcedo','Santangelo','Tachibana','Tremaine','Ulvaeus','Valdivia','Valentijn','Vandermeer','Wojcik','Yamashita','Zakharov','Zelenko','Okoro','Adeleke','Fujiwara','Kowal','Haugen','Lindahl','Moreira','Bianchi','Petrovic','Varela','Medeiros','Cavalcanti','Oyelowo','Achebe','Boateng','Afolabi','Morita','Sugimoto','Oshiro','Kurosawa','Sakamoto','Hoang','Nguyen','Pham','Kim','Choi','Seo','Jang','Han','Abrantes','Achterhof','Ackerley','Aitken','Akintola','Alderete','Alvarado','Amundsen','Anagnos','Andersen','Angelopoulos','Apostol','Arceneaux','Argento','Arkhipov','Armitage','Arrieta','Ashworth','Aurelian','Ayodele','Azoulay','Bachmann','Baek','Bagheri','Baldacci','Ballantyne','Barragan','Bartosz','Basarab','Battiste','Bauer','Beaufort','Bechtel','Belanger','Belmonte','Benavides','Bergeron','Birch','Bjornstad','Blaauw','Blackburn','Bocanegra','Bogdanov','Borisov','Bouchard','Bradshaw','Brodeur','Bruckner','Buckland','Bulgakov','Caballero','Cadogan','Cahill','Calvino','Campbell','Cantrell','Capello','Carvajal','Cassidy','Castellano','Catalano','Cavanagh','Cepeda','Chamberlain','Charbonneau','Chiba','Christensen','Clairmont','Cobbold','Colombo','Conti','Corrigan','Costello','Coulter','Cristescu','Cruickshank','Cullen','Czerny','Dabrowski','Dalgleish','Danvers','Dasgupta','Demetriou','Desrosiers','Devlin','Dimaggio','Donati','Dorsey','Draganov','Dubois','Dufresne','Dunleavy','Eastwood','Edevane','Eichel','Ellingsen','Enomoto','Escobar','Evangelou','Faulkner','Federov','Ferrante','Finnegan','Fiorelli','Fitzroy','Flanagan','Fogarty','Foxworth','Fraser','Frey','Fuentes','Fujimoto','Gallagher','Galvani','Garibaldi','Gaskell','Gervais','Glassford','Godinez','Goncharov','Grabowski','Granville','Gresham','Grigoriev','Guillory','Gunderson','Gutierrez','Halvard','Hamamoto','Harcourt','Hartmann','Hashemi','Hatfield','Hayward','Hedlund','Henning','Herrera','Hidalgo','Hinojosa','Hirata','Hochberg','Holmgren','Hopewell','Hosseini','Hunnicutt','Iglesias','Inagaki','Iversen','Izquierdo','Jablonski','Jacquard','Janssen','Jauregui','Jelinek','Joubert','Kaczmarek','Kalnins','Kamara','Karimi','Kasprzak','Kensington','Kirkland','Kolar','Koenig','Kristiansen','Kuznetsov','Lagarde','Lambrecht','Larsson','Laszlo','Lavoie','Leandros','Lebedev','Leighton','Leventis','Lichtenberg','Lisowski','Llewellyn','Longhurst','Lorenzetti','Lowry','Lysenko','Machado','Maclaren','Malik','Mancini','Markovic','Martel','Matsumoto','Mazur','Mcallister','Medvedev','Meissner','Mendez','Merlo','Mikkelsen','Miyazaki','Morozov','Mortensen','Mulligan','Nevins','Nieminen','Novotny','Ocampo','Odegaard','Okamoto','Olander','Osborne','Padilla','Palmieri','Paredes','Pasternak','Pavlenko','Pellerin','Perrault','Pettersson','Piccolo','Pinheiro','Pokorny','Prendergast','Pruitt','Quinlan','Rautenberg','Reinholt','Restrepo','Riordan','Rivas','Robichaud','Rodin','Romanov','Rosario','Rousseau','Rutkowski','Sabatini','Saarinen','Sakai','Salinas','Sandström','Santoro','Sarkis','Savard','Scarlatti','Schaefer','Seabrook','Segura','Shevchenko','Sigurdsson','Silvestri','Slater','Solberg','Soriano','Stanislav','Steinberg','Sundberg','Svensson','Takahashi','Tellez','Thibodeaux','Torres','Treadwell','Trujillo','Underhill','Urquhart','Vanterpool','Vasiliev','Velasquez','Villanueva','Voronin','Waldmann','Warrington','Weatherby','Westergaard','Whitaker','Wilhelmsen','Winterbourne','Wozniak','Yablonsky','Yoshida','Ystad','Zaragoza','Zielinski','Zuniga'];
const SYL_A = ['Var','Kel','Dra','Mor','Sil','Thal','Bren','Cor','Zan','Ves','Hal','Ril'];
const SYL_B = ['den','mont','grave','wick','dor','vane','holt','rin','ster','mere','lock','tane'];

/* ---------- Candidate generation ---------- */

/* ---------- Families: register together, consecutive numbers, automatic family alliance ---------- */
// ---- family shapes: [weight, name, slots]; a slot is [generation, sibling group, group of their own children]
const FAM_SHAPES = {   // slot: [generation, sibling group, group of their children, couple?, tag]; tags: half, step, far, inlaw, great
  2: [[44,'sib',[[0,'a'],[0,'a']]],[20,'par',[[0,'a','b'],[1,'b']]],[6,'gp',[[0,'a','b'],[2,'c']]],[9,'cous',[[0,'a'],[0,'b']]],[6,'aunt',[[0,'a'],[1,'c']]],
      [4,'half',[[0,'a',null,0,'half'],[0,'a',null,0,'half']]],[3,'step',[[0,'a',null,0,'step'],[0,'a',null,0,'step']]],[3,'far',[[0,'a',null,0,'far'],[0,'b',null,0,'far']]],
      [3,'inlaw',[[0,'a',null,0,'inlaw'],[0,'b',null,0,'inlaw']]],[2,'great',[[0,'a',null,0,'great'],[2,'c',null,0,'great']]]],
  3: [[12,'cpl',[[0,'a','b',1],[0,'a','b',1],[1,'b']]],[28,'sib',[[0,'a'],[0,'a'],[0,'a']]],[24,'par',[[0,'a','b'],[1,'b'],[1,'b']]],[12,'three',[[0,'a','b'],[1,'b','c'],[2,'c']]],
      [10,'mix',[[0,'a','b'],[1,'b'],[1,'c']]],[9,'cous',[[0,'a'],[0,'a'],[0,'b']]],[9,'ext',[[0,'a'],[1,'c'],[1,'c']]],[4,'half',[[0,'a',null,0,'half'],[0,'a',null,0,'half'],[0,'b',null,0,'far']]]],
  4: [[16,'cpl',[[0,'a','b',1],[0,'a','b',1],[1,'b'],[1,'b']]],[28,'par',[[0,'a','b'],[1,'b'],[1,'b'],[1,'b']]],[24,'branches',[[0,'a','b'],[0,'a','c'],[1,'b'],[1,'c']]],
      [16,'three',[[0,'a','b'],[1,'b','c'],[1,'b'],[2,'c']]],[12,'sib',[[0,'a'],[0,'a'],[0,'a'],[0,'a']]],[10,'clan',[[0,'a','b'],[1,'b'],[1,'c'],[1,'d']]]],
  5: [[35,'three',[[0,'a','b'],[1,'b','c'],[1,'b','d'],[2,'c'],[2,'d']]],[35,'par',[[0,'a','b'],[1,'b'],[1,'b'],[1,'b'],[1,'b']]],[30,'branches',[[0,'a','b'],[0,'a','c'],[1,'b'],[1,'b'],[1,'c']]]]
};
// family types: weight and which shapes they fit
const FAM_TYPES = {
  close:{w:22, label:'Close-knit'}, legacy:{w:10, label:'Hunter lineage'}, fractured:{w:13, label:'Divided'},
  strangers:{w:7, label:'Strangers by blood', ok: sh => ['sib','cous','aunt','mix','branches','half','far','great','ext'].includes(sh)},
  adopted:{w:8, label:'Chosen family'}, clan:{w:5, label:'Feared clan'}, business:{w:7, label:'Merchant dynasty'},
  poor:{w:10, label:'Large and poor'}, protective:{w:8, label:'Protective parent', ok: sh => ['par','three','mix','cpl'].includes(sh)},
  rival:{w:6, label:'Rival branches', ok: sh => ['cous','branches','mix','aunt','far','inlaw','clan','half','step'].includes(sh)}
};
const famPl = L => L + (/(s|x|z|ch|sh)$/i.test(L) ? 'es' : 's');
const wpick = (rng, arr, w) => { let r = rng() * arr.reduce((t, x) => t + w(x), 0); return arr.find(x => (r -= w(x)) < 0) || arr[0]; };
// lay a family out: ages that make sense for its generations, a type, and the background its members share
function shapeFamily(members, rng, edition){
  const n = Math.min(5, members.length), sh = wpick(rng, FAM_SHAPES[n], x => x[0]), slots = sh[2];
  const maxG = Math.max(...slots.map(x => x[0]));
  const base = maxG === 0 ? 14 + rng() * 30 : maxG === 1 ? 40 + rng() * 22 : 60 + rng() * 20;
  const gA = [base]; for(let g = 1; g <= 2; g++) gA[g] = gA[g - 1] - (21 + rng() * 11);
  const lift = Math.max(0, 11 - gA[maxG]); for(let g = 0; g <= 2; g++) gA[g] += lift;
  const twins = sh[1] === 'sib' && rng() < 0.15, seen = {};
  const types = Object.entries(FAM_TYPES).filter(([, t]) => !t.ok || t.ok(sh[1]));
  const type = wpick(rng, types, x => x[1].w)[0];
  const homes = BG.origin.map((o, i) => i).filter(i => !/orphanage|raised by smugglers/.test(BG.origin[i][0]));   // a family that registers together did not grow up in an orphanage
  const bg = {origin: homes[Math.floor(rng() * homes.length)], wait: Math.floor(rng() * BG.wait.length)};
  members.slice(0, n).forEach((c, i) => {
    const [g, br, own, sp, tag] = slots[i], k = g + br; seen[k] = (seen[k] || 0) + 1;
    const off = seen[k] === 1 || (twins && seen[k] === 2) ? 0 : sp ? (rng() < 0.5 ? -1 : 1) * Math.floor(rng() * 5) : (rng() < 0.5 ? -1 : 1) * (1 + Math.floor(rng() * 6));
    c.age = Math.max(10, Math.min(92, Math.round(gA[g] + off)));
    const at = c.attempts && c.attempts[c.attempts.length - 1]; if(at && at.edition === edition) at.age = c.age;
    Object.assign(c.family, {type, shape: sh[1], gen: g, br, own: own || null, sp: !!sp, tag: tag || null, bg});
    if(type === 'poor') c.motive = MOTIVES.findIndex(m => /family debt/.test(m.m));
    if(type === 'legacy') c.motive = MOTIVES.findIndex(m => /famous Hunter parent/.test(m.m));
  });
}
// older saves: guess generations from the age gaps
function inferFamily(members){
  const by = members.slice().sort((a, b) => b.age - a.age); let g = 0;
  by.forEach((c, i) => { if(i && by[i - 1].age - c.age >= 18) g = Math.min(2, g + 1); Object.assign(c.family, {type: c.family.type || 'close', gen: g, br: 'g' + g, own: 'g' + (g + 1), sp: false}); });
  [0, 1, 2].forEach(G => { const same = by.filter(c => c.family.gen === G); same.forEach(c => { if(same[0].age - c.age > 12) c.family.br = 'g' + G + 'x'; }); });
  // two adults of the same generation with children below them are most likely a couple
  [0, 1].forEach(G => { const same = by.filter(c => c.family.gen === G); if(same.length === 2 && by.some(c => c.family.gen === G + 1)) same.forEach(c => c.family.sp = true); });
}
// how b is related to a, in b's own words ("older sister", "cousin", "grandfather")
function relWord(a, b){
  const fa = a.family, fb = b.family, g = (m, f, x) => b.gender === 'Male' ? m : b.gender === 'Female' ? f : x;
  if(!fa || !fb || fa.gen === undefined || fb.gen === undefined) return 'relative';
  const d = fb.gen - fa.gen;
  if(d === 0 && fa.sp && fb.sp) return g('husband', 'wife', 'partner');
  const tag = fa.tag && fa.tag === fb.tag ? fa.tag : null;
  if(d === 0 && tag === 'half') return g('half-brother', 'half-sister', 'half-sibling');
  if(d === 0 && tag === 'step') return g('stepbrother', 'stepsister', 'stepsibling');
  if(d === 0 && tag === 'inlaw') return g('brother-in-law', 'sister-in-law', 'sibling-in-law');
  if(d === 0 && (tag === 'far' || (fa.tag === 'far' || fb.tag === 'far'))) return 'second cousin';
  if(Math.abs(d) === 2 && tag === 'great') return d < 0 ? g('great-uncle', 'great-aunt', 'great-aunt or uncle') : g('great-nephew', 'great-niece', "sibling's grandchild");
  if(d === 0) return fa.br === fb.br ? (a.age === b.age ? 'twin ' : b.age > a.age ? 'older ' : 'younger ') + g('brother', 'sister', 'sibling') : 'cousin';
  if(d === -1) return fb.own === fa.br ? g('father', 'mother', 'parent') : g('uncle', 'aunt', "parent's sibling");
  if(d === 1) return fa.own === fb.br ? g('son', 'daughter', 'child') : g('nephew', 'niece', "sibling's child");
  return d < 0 ? g('grandfather', 'grandmother', 'grandparent') : g('grandson', 'granddaughter', 'grandchild');
}
// "his younger sister", "her grandfather": b as seen from a
const kinOf = (a, b) => PR(a).their + ' ' + relWord(a, b);
// families from older saves (or an exam already under way) get generations guessed from their ages
function ensureFamilies(S){
  const g = {};
  (S.candidates || []).forEach(c => { if(c.fam && c.family) (g[c.family.key] = g[c.family.key] || []).push(c); });
  Object.values(g).forEach(m => { if(m.length > 1 && m.some(c => c.family.gen === undefined)) inferFamily(m); });
}
function buildFamilies(list, count, edition, seed){
  const rng = makeRng((seed ^ 0xFA111E5) >>> 0);
  const budget = Math.floor(count * 0.05);                      // at most 5% of all participants
  const used = new Set(list.map(c => c.name));
  const groups = [];
  // returning relatives: restore the family if 2+ of them came back together
  const back = {};
  list.filter(c => c.family && c.attempts && c.attempts.length > 1).forEach(c => (back[c.family.key] = back[c.family.key] || []).push(c));
  let usedSlots = 0;
  rng.shuffle(Object.values(back)).forEach(g => {
    if(g.length < 2) return;
    const take = g.slice(0, 5);
    if(usedSlots + take.length > budget) return;               // over the cap: they enter as individuals this time
    take.forEach(c => c.famActive = true);
    if(take.some(c => c.family.gen === undefined)) inferFamily(take);
    groups.push({key: take[0].family.key, last: take[0].family.last, members: take, returning: true});
    usedSlots += take.length;
  });
  // new families: rare, and some editions stay well under the cap
  let target = Math.max(0, Math.floor(budget * (0.25 + rng() * 0.75)) - usedSlots);
  const famLast = new Set(groups.map(g => g.last));
  const pool = rng.shuffle(list.filter(c => !(c.attempts && c.attempts.length > 1) && !c.family));
  let pi = 0;
  while(target >= 2 && pi < pool.length - 1){
    const r = rng();
    let size = r < 0.45 ? 2 : r < 0.75 ? 3 : r < 0.92 ? 4 : 5;
    size = Math.min(size, target, pool.length - pi);
    if(size < 2) break;
    let last, tries = 0;
    do { last = rng.pick(LAST); tries++; } while(famLast.has(last) && tries < 50);
    famLast.add(last);
    const members = [], firsts = new Set();
    while(members.length < size && pi < pool.length){
      const c = pool[pi++];
      const nm = c.first + ' ' + last;
      if(firsts.has(c.first) || (used.has(nm) && nm !== c.name)) continue;
      used.delete(c.name); used.add(nm);
      c.last = last; c.name = nm; firsts.add(c.first);
      members.push(c);
    }
    if(members.length < 2){ members.forEach(c => delete c.famActive); continue; }
    const key = 'FAM-' + last + '-' + edition;
    members.forEach(c => { c.family = {key, last, since: edition}; c.famActive = true; });
    shapeFamily(members, rng, edition);
    groups.push({key, last, members, returning: false});
    target -= members.length;
  }
  // registration numbers: family blocks first, then everyone else; blocks keep consecutive numbers
  const inFam = new Set(groups.flatMap(g => g.members.map(c => c.id)));
  const units = groups.map(g => rng.shuffle(g.members.slice())).concat(list.filter(c => !inFam.has(c.id)).map(c => [c]));
  rng.shuffle(units);
  let n = 1;
  units.forEach(u => u.forEach(c => {
    c.reg = n++;
    const at = c.attempts && c.attempts[c.attempts.length - 1];
    if(at && at.edition === edition) at.reg = c.reg;
  }));
  list.forEach(c => { if(!inFam.has(c.id)) delete c.famActive; });
}
function setupFamilies(S){
  ensureFamilies(S);
  const groups = {};
  S.candidates.filter(c => c.famActive).forEach(c => (groups[c.family.key] = groups[c.family.key] || []).push(c));
  Object.values(groups).forEach(g => {
    g.sort((a, b) => a.reg - b.reg);
    const A = {id:'F' + (S.alliances.length + 1), family:true, famKey:g[0].family.key, name:g[0].family.last + ' Family', members:g.map(c => c.id), ever:g.map(c => c.id), formed:0, saves:0, betrayals:0, together:0, peak:g.length};
    S.alliances.push(A);
    g.forEach(c => { c.fam = A.id; c.notes.push({p:0, text:`Registered with the ${A.name} as #${g[0].reg}–#${g[g.length-1].reg}`}); });
    const ret = g.some(c => c.attempts && c.attempts.length > 1);
    log(S, 0, 'family', `The ${A.name} ${ret ? 'is back and registered' : 'registered'} together as candidates #${g[0].reg}–#${g[g.length-1].reg}.`, g.map(c => c.id));
  });
}

const RESET_FIELDS = {status:'Active', out:null, reason:'', fatigue:0, wins:0, losses:0, badges:[], target:null, points:0, injury:null, debt:null, pmod:0, sabBy:null, sabP:null, sabs:0, crushOn:false};
function generateCandidates(edition, count, seed, returning){
  returning = returning || [];
  const rng = makeRng(seed);
  const used = new Set(returning.map(r => r.name));
  const regs = rng.shuffle(Array.from({length: count}, (_, i) => i + 1));
  const list = [];
  const newCount = Math.max(0, count - returning.length);
  for(let i=0;i<newCount;i++){
    const gr = rng();
    const gender = gr < 0.46 ? 'Male' : gr < 0.92 ? 'Female' : 'Non-binary';
    const pool = gender === 'Male' ? FIRST_M : gender === 'Female' ? FIRST_F : FIRST_N;
    let first, last, name, tries = 0;
    do {
      first = rng.pick(pool);
      last = tries < 20 ? rng.pick(LAST) : rng.pick(SYL_A) + rng.pick(SYL_B);
      name = first + ' ' + last; tries++;
    } while(used.has(name) && tries < 200);
    used.add(name);

    // most first-timers are young and willing to risk it: about 5 in 6 are 13–22, averaging 17
    const ar = rng(), age = ar < 0.04 ? rng.int(11, 12) : ar < 0.88 ? clamp(Math.round(rng.gauss(17, 2.6)), 13, 22) : ar < 0.96 ? rng.int(23, 35) : rng.int(36, 60);

    const tr = rng();
    const tier = tr < .55 ? 'Ordinary' : tr < .85 ? 'Trained' : tr < .97 ? 'Skilled' : 'Elite';
    const mean = {Ordinary: 44, Trained: 50, Skilled: 56, Elite: 61}[tier];
    const a = {};
    ATTRS.forEach(([k]) => a[k] = rng.gauss(mean, 9));
    const keys = rng.shuffle(ATTRS.map(x => x[0]));
    const nStr = rng.int(2, 3);
    keys.slice(0, nStr).forEach(k => a[k] += rng.gauss(22, 6));
    keys.slice(nStr, nStr + 2).forEach(k => a[k] -= rng.gauss(18, 5));
    for(const k in a){
      let v = Math.round(a[k]);
      if(v > 95 && rng() > 0.2) v = 89 + rng.int(0, 6);   // keep >95 extremely rare
      a[k] = clamp(v, 1, 100);
    }
    // avoid candidates excellent at everything
    const high = Object.keys(a).filter(k => a[k] >= 75).sort((x,y) => a[y]-a[x]);
    high.slice(4).forEach(k => a[k] = rng.int(55, 70));

    list.push({
      id: 'HX' + edition + '-' + (seed % 9973).toString(36) + '-' + i.toString(36),
      reg: regs[i], first, last, name, age, gender, tier, a,
      status: 'Active', out: null, reason: '', fatigue: 0,
      scores: {}, notes: [], wins: 0, losses: 0,
      badges: [], target: null, points: 0,
      attempts: [{edition, reg: regs[i], age, improvements: [], phase:null, phaseName:'', result:'In progress', reason:'', status:'In progress'}]
    });
  }
  // returning candidates keep identity and history, get a fresh registration number
  returning.forEach((r, k) => {
    const c = JSON.parse(JSON.stringify(r));
    const improve = c.pendingImprove || [], impAmt = c.pendingAmt || 2;
    delete c.pendingImprove; delete c.pendingAmt;
    ['scores','notes'].forEach(f => c[f] = f === 'scores' ? {} : []);
    ['team','ally','alliance','fam','famActive','perf','cookFail','rescuedBy','kills','killedBy','nen','zFights'].forEach(f => delete c[f]);
    Object.assign(c, JSON.parse(JSON.stringify(RESET_FIELDS)));
    c.reg = regs[newCount + k];
    c.attempts = (c.attempts || []).concat([{edition, reg:c.reg, age:c.age, improvements:improve, impAmt, phase:null, phaseName:'', result:'In progress', reason:'', status:'In progress'}]);
    list.push(c);
  });
  buildFamilies(list, count, edition, seed);
  return list;
}

/* ---------- Phases: a pool of trials; each edition draws its own lineup ---------- */
const PRISONER_NAMES_DEF = ['Bendot','Sedokan','Majitani','Johness','Leroute','Tompa','Brodo','Gazul','Murk','Vexa','Old Kreel','Sabbath','Dorran','Grisette','Hask'];
const PHASE_DEFS = {
  sea:{name:'Sea Voyage', stage:0, w:{endurance:.4,courage:.3,teamwork:.3}, T:36, fatigue:10, rescue:'pulled {v} back aboard',
   fail:{endurance:'was laid low by seasickness and left the ship at the first port', courage:'panicked during the storm and asked to be put ashore', teamwork:'refused to help the crew and was thrown off the ship'}},
  quiz:{name:'Questioning Trial', stage:0, w:{intelligence:.6,perception:.4}, T:37,
   fail:{intelligence:'answered the old woman\'s dilemma and was turned away', perception:'missed that silence was the correct answer'}},
  disguise:{name:'Disguise Trial', stage:0, w:{perception:.6,intelligence:.4}, T:39, rest:true,
   fail:{perception:'trusted a Kiriko imitating a human guide', intelligence:'could not tell the shapeshifters apart and was led astray'}},
  nighttrain:{name:'Night Train', stage:0, w:{perception:.4,courage:.3,strategy:.3}, T:38, rest:true,
   fail:{perception:'never noticed the conductor was an examiner and was put off the train', courage:'jumped off when the bandits boarded', strategy:'bet {their} ticket in a card game and lost it'}},
  cliffpath:{name:'Cliffside Path', stage:0, w:{agility:.4,courage:.35,endurance:.25}, T:37, fatigue:12, rescue:'caught {v} by the wrist at the cliff edge',
   fail:{agility:'slipped on the loose rocks and was carried back down', courage:'refused to cross the rope bridge', endurance:'could not keep climbing in the thin air'}},
  marathon:{name:'Underground Marathon', stage:1, w:{endurance:.5,speed:.25,determination:.25}, T:43, fatigue:45,
   fail:{endurance:'ran out of stamina in the tunnels', speed:'fell too far behind the examiner', determination:'gave up when the pace increased'}},
  stairs:{name:'Staircase', stage:1, w:{endurance:.4,strength:.3,determination:.3}, T:41, fatigue:25,
   fail:{endurance:'collapsed halfway up the staircase', strength:'legs gave out on the endless steps', determination:'sat down on the stairs and did not get up'}},
  wetlands:{name:'Dangerous Wetlands', stage:1, w:{perception:.4,agility:.3,courage:.3}, T:42, fatigue:15, rest:true, rescue:'dragged {v} out of the swamp mud', obstacle:true,
   fail:{perception:'followed a fake examiner into the mist', agility:'was dragged under by the swamp mud', courage:'froze when the wetland predators attacked'}},
  desert:{name:'Desert Crossing', stage:1, w:{endurance:.45,determination:.3,strategy:.25}, T:42, fatigue:40,
   fail:{endurance:'collapsed from the heat in the dunes', determination:'turned back at the first mirage', strategy:'rationed {their} water badly and ran dry'}},
  nighthunt:{name:'Night Forest Chase', stage:1, w:{perception:.35,speed:.35,courage:.3}, T:42, fatigue:20, rest:true, rescue:'pulled {v} out of a hunter\'s pit', obstacle:true,
   fail:{perception:'lost sight of the examiner\'s lantern in the dark', speed:'could not keep up through the trees', courage:'stopped running when the forest started howling'}},
  mountain:{name:'Mountain Ascent', stage:1, w:{strength:.35,endurance:.35,agility:.3}, T:41, fatigue:30, rescue:'hauled {v} up on the rope', obstacle:true,
   fail:{strength:'could not pull {themselves} over the ledge', endurance:'ran out of breath before the summit', agility:'lost {their} footing on the ice'}},
  capture:{name:'Creature Capture', stage:2, w:{strength:.35,agility:.35,strategy:.3}, T:45, fatigue:10, obstacle:true,
   fail:{strength:'could not bring down a Great Stamp', agility:'was trampled by a charging Great Stamp', strategy:'chased the herd without a plan and came back empty-handed'}},
  cooking:{name:'Cooking Trial', stage:2, w:{intelligence:.4,perception:.3,agility:.3}, T:55,
   fail:{intelligence:'served a dish the examiner called inedible', perception:'missed the examiner\'s hidden expectations', agility:'botched the knife work and ran out of time'}},
  egg:{name:'Egg Retrieval', stage:2, w:{courage:.4,agility:.35,perception:.25}, T:48, rest:true, obstacle:true,
   fail:{courage:'refused to jump into the ravine', agility:'missed the web and had to be rescued', perception:'misread the updraft and lost the egg'}},
  auction:{name:'Auction Trial', stage:2, w:{intelligence:.35,charisma:.35,strategy:.3}, T:44, rest:true,
   fail:{intelligence:'overpaid for a forgery and was disqualified', charisma:'was outbid by every rival at the table', strategy:'spent the whole budget on the first lot'}},
  beast:{name:'Beast Taming', stage:2, w:{courage:.35,charisma:.3,agility:.35}, T:45, fatigue:10, obstacle:true,
   fail:{courage:'backed away from the beast and lost it', charisma:'could not earn the creature\'s trust', agility:'was thrown off and trampled'}},
  treasure:{name:'Treasure Hunt', stage:2, w:{perception:.4,intelligence:.35,determination:.25}, T:46, rest:true,
   fail:{perception:'walked past the hidden cache twice', intelligence:'could not decode the map', determination:'gave up digging at sunset'}},
  tower:{name:'Trick Tower', stage:3, xp:'team3', w:{intelligence:.4,strategy:.35,teamwork:.25}, T:51, team:true, fatigue:15, obstacle:true,
   flavor:{done:'reached the bottom', timeout:'Still inside when the 72 hours ran out', inside:'inside the tower', within:'reached the bottom within 72 hours'},
   fail:{intelligence:'team could not solve the tower route', strategy:'team chose the long route and ran out of time', teamwork:'team deadlocked on every majority vote'}},
  prisoner:{name:'Prisoner Challenges', stage:3, xp:'duel3', w:{combat:.4,intelligence:.3,strategy:.3}, prisoner:true, rest:true, npc:'prisoner', npcs:PRISONER_NAMES_DEF,
   fail:{combat:'was beaten in a death-match by a prisoner', intelligence:'lost the prisoner\'s riddle wager', strategy:'gambled away the remaining hours'}},
  maze:{name:'Underground Labyrinth', stage:3, xp:'team3', w:{intelligence:.35,perception:.35,teamwork:.3}, T:51, team:true, fatigue:15, obstacle:true,
   flavor:{done:'found the exit', timeout:'Still lost when the 72 hours ran out', inside:'in the labyrinth', within:'found the exit within 72 hours'},
   fail:{intelligence:'team never cracked the labyrinth\'s pattern', perception:'team walked in circles past the same marks', teamwork:'team split up and lost each other'}},
  guardians:{name:'Labyrinth Guardians', stage:3, xp:'duel3', w:{combat:.4,intelligence:.3,strategy:.3}, prisoner:true, rest:true, npc:'guardian', npcs:['Stone Warden','Old Sphinx','Mirror Knight','Lamp Keeper','Twin Masks','Grey Hound','The Locksmith','Gatekeeper Ume','Brass Golem'],
   fail:{combat:'was beaten by a labyrinth guardian', intelligence:'failed the guardian\'s riddle', strategy:'chose the wrong door and was sealed out'}},
  raft:{name:'River Rafting', stage:3, xp:'team3', w:{strength:.3,teamwork:.4,courage:.3}, T:51, team:true, fatigue:25, obstacle:true,
   flavor:{done:'reached the delta', timeout:'Still on the river when the 72 hours ran out', inside:'on the river', within:'reached the delta within 72 hours'},
   fail:{strength:'team could not hold the raft against the rapids', teamwork:'team paddled against each other and capsized', courage:'team refused to run the waterfall'}},
  bandits:{name:'River Bandits', stage:3, xp:'duel3', w:{combat:.4,intelligence:.3,strategy:.3}, prisoner:true, rest:true, npc:'bandit', npcs:['One-Eye Rourk','The Ferryman','Salt Jack','Mad Coral','Hook Ilsa','Captain Dredge','Brine Sister','Old Weasel'],
   fail:{combat:'was beaten by a river bandit', intelligence:'lost the bandit\'s riddle toll', strategy:'paid the toll with {their} remaining hours'}},
  centennial:{name:'Centennial Trial', stage:3, w:{endurance:.2,courage:.2,strategy:.2,perception:.2,determination:.2}, T:50, fatigue:30, rest:true, obstacle:true, rescue:'pulled {v} out of the collapsing passage',
   fail:{endurance:'collapsed on the last of the hundred stairs', courage:'turned back at the gate of names', strategy:'took the wrong road at the fork of a hundred years', perception:'never saw the trial\'s hidden exit', determination:'sat down beside the old stone and stayed there'}},
  zevil:{name:'Zevil Island', stage:4, w:{perception:.25,strategy:.25,speed:.2,combat:.3}, zevil:true, rest:true},
  final:{name:'Final Tournament', stage:5, w:{combat:.4,strength:.25,agility:.2,determination:.15}, final:true}
};
const STAGE_NAME = ['Preliminary','Phase 1','Phase 2','Phase 3','Phase 4','Phase 5'];
Object.entries(PHASE_DEFS).forEach(([id, d]) => { d.id = id; d.group = STAGE_NAME[d.stage]; d.xpKey = d.xp || id; });
const CLASSIC = ['sea','quiz','disguise','marathon','stairs','wetlands','capture','cooking','egg','tower','prisoner','zevil','final'];
const CLASSIC_REF = {marathon:196, stairs:159, wetlands:133, capture:102, cooking:78, tower:30, prisoner:14};
const LEGACY_KEYS = CLASSIC.map(id => PHASE_DEFS[id].xpKey);
const EX_STYLES = {
  Fair:{desc:'fair and by the book'},
  Strict:{t:3, desc:'strict — the bar is higher than usual'},
  Lenient:{t:-3, desc:'known for giving candidates a chance'},
  Physical:{phys:1.6, desc:'cares about strength and stamina above all'},
  Cerebral:{ment:1.6, desc:'rewards sharp minds over muscle'},
  Cruel:{t:2, fat:1.5, norescue:true, desc:'cruel — no rescues and a punishing pace'},
  Unpredictable:{noise:1.6, desc:'impossible to read; luck matters more than usual'}
};
const EX_NAMES = ['Satotz','Menchi','Buhara','Lippo','Kurt','Ilma','Todo','Belerba','Mizar','Orsolya','Haskin','Velda','Grubb','Nessa','Corrin','Dagobert','Yuzuki','Pallas','Rook','Severine','Ambrosio','Tilde','Okko','Marisse'];
const CAREER_FOR = {cooking:'Gourmet', capture:'Beast', beast:'Beast', treasure:'Treasure', auction:'Jackpot', sea:'Sea', maze:'Ruins', guardians:'Ruins', tower:'Crime', prisoner:'Crime', zevil:'Blacklist', nighthunt:'Blacklist', desert:'Lost', mountain:'Lost', raft:'Sea', bandits:'Crime'};
function styleFromHunter(h){
  const a = h.attrs; if(!a) return 'Fair';
  const phys = (a.strength + a.speed + a.endurance + a.agility) / 4, ment = (a.intelligence + a.perception + a.strategy) / 3;
  if(a.teamwork < 40 && a.combat > 65) return 'Cruel';
  if(phys - ment > 8) return 'Physical';
  if(ment - phys > 8) return 'Cerebral';
  if(a.charisma > 70) return 'Lenient';
  if(a.determination > 72) return 'Strict';
  return 'Fair';
}
function buildLineup(seed, edition, hunters, special, legends, theme){
  const rng = makeRng((seed ^ 0x1E5CA9E) >>> 0);
  const ids = [];
  if(special === 'centenary'){
    // the hundredth exam walks the road of the first one, plus a trial of its own
    ids.push('sea', 'quiz', 'disguise', 'marathon', 'stairs', 'wetlands', 'capture', 'cooking', 'egg', 'tower', 'prisoner', 'centennial', 'zevil', 'final');
  } else if(special === 'jubilee'){
    // the Jubilee: a shorter, kinder road
    ids.push(rng.pick(['sea','quiz','disguise','nighttrain','cliffpath']));
    ids.push(...rng.shuffle(['marathon','stairs','wetlands','desert','nighthunt','mountain']).slice(0, 2));
    ids.push(rng.pick(['auction','beast','treasure','capture']));
    ids.push('zevil', 'final');
  } else {
  ids.push(...rng.shuffle(['sea','quiz','disguise','nighttrain','cliffpath']).slice(0, rng.int(2, 3)));
  ids.push(...rng.shuffle(['marathon','stairs','wetlands','desert','nighthunt','mountain']).slice(0, rng.int(2, 3)));
  if(rng() < 0.45) ids.push('capture', 'cooking', 'egg');
  else ids.push(...rng.shuffle(['auction','beast','treasure','capture']).slice(0, 2));
  ids.push(...rng.pick([['tower','prisoner'], ['maze','guardians'], ['raft','bandits']]));
  ids.push('zevil', 'final');
  }
  // the theme of the year sometimes brings a trial of its own, in place of one endurance trial (never in the centenary)
  const tt = THEME_TRIAL[theme];
  if(tt && special !== 'centenary' && rng() < (special === 'jubilee' ? 0.6 : 0.4)){ let at = -1; ids.forEach((id, i) => { if(PHASE_DEFS[id].stage === 1) at = i; }); if(at >= 0) ids[at] = tt; }
  const legend = (legends || []).slice();   // the Chairman, the Zodiac or a former Chairman serve as examiners in special years
  const refs = {1:[196,159,133], 2:[102,78,70], 3:[30,14]}, seen = {};
  const pool = (hunters || []).filter(h => h.edition < edition && h.status !== 'Deceased');
  const usedH = new Set(), usedN = new Set();
  return ids.map(id => {
    const d = PHASE_DEFS[id], k = seen[d.stage] = (seen[d.stage] || 0) + 1;
    let cref = refs[d.stage] ? refs[d.stage][k - 1] || 0 : 0;
    if(id === 'egg') cref = 0;
    if(id === 'centennial') cref = 10;
    if(special === 'jubilee' && cref) cref *= 1;   // more room in every phase
    let ex = null;
    // in the centenary the Chairman takes the Final; everyone else shares the other phases
    const li = special === 'centenary' ? legend.findIndex(x => id === 'final' ? x.role === 'Chairman' : x.role !== 'Chairman') : 0;
    const lg = legend.length && li >= 0 && (special === 'centenary' || rng() < 0.3) ? legend.splice(li, 1)[0] : null;
    if(lg && !usedH.has(lg.license)){ usedH.add(lg.license); return {id, cref, ex: {name: lg.name, license: lg.license, cid: lg.cid, career: lg.career, from: lg.edition, style: styleFromHunter(lg), legend: lg.role || null}}; }
    const fit = pool.filter(h => !usedH.has(h.license) && CAREER_FOR[id] && h.career === CAREER_FOR[id] + ' Hunter');
    const any = pool.filter(h => !usedH.has(h.license));
    const pickH = fit.length && rng() < 0.7 ? rng.pick(fit) : any.length ? rng.pick(any) : null;   // every examiner is a licensed Hunter when one is available
    if(pickH){ usedH.add(pickH.license); ex = {name: pickH.name, license: pickH.license, cid: pickH.cid, career: pickH.career, from: pickH.edition, style: styleFromHunter(pickH)}; }
    else {
      let nm, t = 0; do { nm = rng.pick(EX_NAMES); t++; } while(usedN.has(nm) && t < 30); usedN.add(nm);
      const styles = Object.keys(EX_STYLES), wts = [30, 14, 12, 12, 12, 8, 12];
      let r = rng() * wts.reduce((a, b) => a + b, 0), st = 'Fair'; for(let i = 0; i < styles.length; i++){ r -= wts[i]; if(r <= 0){ st = styles[i]; break; } }
      ex = {name: 'Examiner ' + nm, style: st};
    }
    return {id, cref, ex};
  });
}
const PHYS_ATTR = ['strength','speed','endurance','agility'], MENT_ATTR = ['intelligence','perception','strategy'];
function applyExaminer(d, ex){
  const ph = {...d, w:{...d.w}, ex};
  const st = ex ? EX_STYLES[ex.style] || {} : {};
  const sum = Object.values(ph.w).reduce((a, b) => a + b, 0);
  if(st.phys || st.ment){
    Object.keys(ph.w).forEach(k => { if(st.phys && PHYS_ATTR.includes(k)) ph.w[k] *= st.phys; if(st.ment && MENT_ATTR.includes(k)) ph.w[k] *= st.ment; });
    const s2 = Object.values(ph.w).reduce((a, b) => a + b, 0); Object.keys(ph.w).forEach(k => ph.w[k] *= sum / s2);
  }
  if(ph.T && st.t) ph.T += st.t;
  ph.exT = st.t || 0; ph.exNoise = st.noise || 1; ph.exFat = st.fat || 1; ph.exStyle = ex ? ex.style : null;
  if(st.norescue) ph.rescue = null;
  return ph;
}
const _lineups = new WeakMap();
function lineupOf(S){
  let L = _lineups.get(S);
  if(L && L.spec === S.phaseSpec) return L.arr;
  const spec = S.phaseSpec || CLASSIC.map(id => ({id, cref: CLASSIC_REF[id] || 0, ex: null}));
  const arr = spec.map(sp => applyExaminer({...PHASE_DEFS[sp.id], cref: sp.cref}, sp.ex));
  _lineups.set(S, {spec: S.phaseSpec, arr});
  return arr;
}
let PHASES = lineupOf({});
function useLineup(S){ PHASES = lineupOf(S); return PHASES; }

/* ---------- Hunter careers ---------- */
const CAREERS = [
  ['Blacklist', {combat:1, strategy:.8, perception:.6}, 'Enhancement'],
  ['Treasure', {perception:1, intelligence:.8, agility:.4}, 'Conjuration'],
  ['Beast', {courage:1, charisma:.6, agility:.6}, 'Manipulation'],
  ['Gourmet', {perception:.8, intelligence:.6, agility:.6, charisma:.3}, 'Transmutation'],
  ['Ruins', {intelligence:1, determination:.6, endurance:.4}, 'Conjuration'],
  ['Sea', {endurance:1, courage:.6, speed:.4}, 'Emission'],
  ['Virus', {intelligence:.9, perception:.7, determination:.5}, 'Specialization'],
  ['Lost', {perception:.8, teamwork:.8, endurance:.4}, 'Emission'],
  ['Crime', {strategy:1, perception:.8, combat:.4}, 'Manipulation'],
  ['Jackpot', {charisma:1, strategy:.8, courage:.3}, 'Specialization'],
  ['Music', {charisma:.8, perception:.6, determination:.4}, 'Emission'],
  ['Head', {charisma:.8, intelligence:.6, teamwork:.6}, 'Manipulation']
];
function hunterCareer(c){
  let h = 0; for(const ch of String(c.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = mulberry32(h ^ 0xCA4EE7);
  let best = null;
  CAREERS.forEach(([name, w, nen]) => {
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    const sc = Object.entries(w).reduce((s, [k, v]) => s + v * ((c.a || c.attrs || {})[k] || 50), 0) / tot + (c.nen && c.nen.category === nen ? 6 : 0) + r() * 8;
    if(!best || sc > best.sc) best = {name, sc};
  });
  return best.name + ' Hunter';
}

const weighted = (c, w) => Object.entries(w).reduce((s,[k,v]) => s + v*c.a[k], 0);
const weakest = (c, w) => Object.keys(w).sort((x,y) => c.a[x]-c.a[y])[0];
const verdict = m => m >= 15 ? 'excelled' : m >= 7 ? 'passed comfortably' : m >= 0 ? 'scraped through' : m >= -5 ? 'narrowly failed' : 'failed badly';
const total = c => Object.values(c.a).reduce((s,v) => s+v, 0);

function newState(edition, applicants, licenses, prev, opts){
  const seed = (Math.random()*2**31) >>> 0;
  const theme = (opts && opts.theme && THEMES[opts.theme]) ? opts.theme : pickTheme(seed);   // a world crisis can set the tone of the next exam
  const returning = selectReturning(prev, seed, applicants, theme);
  const special = opts && opts.special || null;
  const phaseSpec = buildLineup(seed, edition, opts && opts.hunters, special, opts && opts.legends, theme);
  const smem = {}; if(prev && prev.smem) Object.entries(prev.smem).forEach(([k, v]) => { if(edition - v <= 3) smem[k] = v; });   // what the camp has heard lately
  const S = { smem, edition, config:{applicants, licenses, groups: special === 'jubilee' ? 4 : 1}, special, seed, theme, phase: 0, finished: false, returning, alliances: [], phaseSpec,
           returnInfo: prev && prev.finished ? {from: prev.edition, eligible: returningEligible(prev).length, returned: returning.length, early: returning.filter(r => r.earlyStandout).length} : null,
           candidates: generateCandidates(edition, applicants, seed, returning), log: [], stats: [], started: false };
  useLineup(S);
  setupFamilies(S);
  setupStories(S);
  if(opts && opts.catastrophe) setupCatastrophe(S, makeRng((seed ^ 0xCA7) >>> 0));
  if(prev && prev.cat){ const back = S.candidates.filter(c => c.fled === prev.edition).length;
    log(S, 0, 'major', `A year after ${prev.cat.name.toLowerCase()}, the Hunter Exam opens again. ${back ? `${back} of the survivors are back to finish what they started.` : 'Few of the survivors have come back.'} There is a minute of silence before the first trial.`, []); }
  return S;
}
/* ---------- Returning candidates ---------- */
// survived, not licensed, and actually entered Phase 3 or later. Disqualified for killing still counts (Killua came back the next year);
// spies and saboteurs do not
const killDQ = c => c.status === 'Disqualified' && /kill/i.test(c.reason || '');
const canReturn = c => c.status === 'Eliminated' || killDQ(c);
const returningEligible = prev => { const L = lineupOf(prev); return prev.candidates.filter(c => canReturn(c) && c.out !== null && L[c.out] && L[c.out].stage >= 3); };
let FORCE_RETURN = new Set();
function selectReturning(prev, seed, cap, theme){
  if(!prev || !prev.finished) return [];
  finalizeAttempts(prev);
  const rng = makeRng((seed ^ 0x51ed270b) >>> 0);
  // as many come back as before (80% of those who reached Phase 3+), but the seats go by a weighted draw:
  // reaching far still matters most, yet a standout who fell early can win a seat
  // the urge to come back fades slowly with failed attempts (stubborn types never give up) and with age past 40
  const STUBBORN = ['Iron-willed','Survivor','Stoic','Workhorse','Zealot','Underdog'];
  const keepTrying = c => { const n = (c.attempts || []).length;
    const tries = STUBBORN.includes(c.trait) ? 1 : c.trait === 'Quitter' ? Math.pow(0.7, n - 1) : Math.max(0.45, Math.pow(0.9, n - 1));
    const age = c.age < 30 ? 1 : c.age < 75 ? Math.max(0.3, Math.pow(0.95, c.age - 30)) : 0.1;
    return 0.8 * tries * age; };
  const quota = Math.round(returningEligible(prev).filter(c => rng() < keepTrying(c)).length * (theme === 'oldguard' ? 1.35 : 1));
  const L = lineupOf(prev), C = prev.candidates;
  const totals = C.map(total).sort((a, b) => b - a), top5 = totals[Math.floor(totals.length * 0.05)] || 0, top15 = totals[Math.floor(totals.length * 0.15)] || 0;
  const pool = C.filter(c => canReturn(c) && c.out !== null && L[c.out] && !c.noReturn);
  const weight = c => {
    const st = L[c.out].stage;
    let w = st >= 3 ? 10 : st === 2 ? 1.2 : st === 1 ? 0.25 : 0.06;
    const t = total(c); if(t >= top5) w *= 5; else if(t >= top15) w *= 2;
    if(c.nick && !['personal', 'return'].includes(c.nickKind)) w *= 2.5;
    if((c.rescues || 0) > 0) w *= 1.6;
    if(c.notes.some(n => /excelled|Led|front of the pack|Guided team/.test(n.text))) w *= 1.6;
    if(/by a hair/.test(c.reason || '')) w *= 1.8;
    if((c.grudges || []).length) w *= 1.3;
    if(c.fled === prev.edition) w *= 6;   // survivors of a catastrophe come back to finish what they started
    if(c.crusher) w *= 3;
    w *= keepTrying(c) / 0.8;
    if((c.bonds || []).some(x => { const o = C.find(y => y.id === x.id); return o && o.status === 'Eliminated'; })) w *= 2;   // bonded pairs tend to come back together
    return w;
  };
  // sponsored apprentices always come back (their mentor pays the fee)
  const forced = C.filter(c => FORCE_RETURN.has(c.id) && canReturn(c) && c.out !== null);
  let back = forced.concat(pool.filter(c => !FORCE_RETURN.has(c.id)).map(c => ({c, k: Math.pow(rng(), 1 / weight(c))})).sort((a, b) => b.k - a.k).slice(0, Math.max(0, quota - forced.length)).map(x => x.c));
  if(back.length > cap){ const keep = back.slice(forced.length); rng.shuffle(keep); back = forced.concat(keep).slice(0, cap); }
  // the survivors of a catastrophe come back in numbers, the ones who usually come back most of all
  if(prev.cat){ const have = new Set(back.map(c => c.id)); C.filter(c => c.fled === prev.edition && !have.has(c.id) && canReturn(c) && rng() < Math.min(0.9, keepTrying(c) * ((c.attempts || []).length > 1 ? 1 : 0.3))).forEach(c => back.push(c)); }
  return back.map(c => {
    const r = JSON.parse(JSON.stringify(c));
    const last = r.attempts && r.attempts[r.attempts.length - 1];
    if(last && last.edition === prev.edition){
      if(!last.start) last.start = {...c.a};                                    // attributes as they were in that exam
      if(!last.ids){ const ph = c.out ?? L.length - 1; last.ids = L.slice(0, ph + 1).map(x => x.xpKey); last.passedIds = L.slice(0, ph).map(x => x.xpKey); }
    }
    r.age += 1;                                                   // one year older per new entry
    if(r.age > 35) PHYS_ATTR.forEach(k => { if(rng() < 0.5) r.a[k] = Math.max(1, r.a[k] - 1); });   // the body slowly gives way
    r.prevAllies = (r.pastAllies || []).slice();                  // allies remembered from earlier exams
    const amt = (r.attempts || []).length <= 1 ? 2 : 1;               // 3 distinct attributes: +2 on the first return, +1 after that
    const keys = rng.shuffle(ATTRS.map(x => x[0])).slice(0, 3);
    keys.forEach(k => r.a[k] = Math.min(100, r.a[k] + amt));
    r.pendingAmt = amt;
    r.pendingImprove = keys;
    if(r.bg) r.bg.since = nhash(r.id + ':since:' + prev.edition) % BG.since.length;
    r.earlyStandout = L[c.out].stage < 3;
    if(killDQ(c)){ const mk = (c.reason || '').match(/kill(?:ing|ed) (.+?)(?: and | in |$)/); r.dqKill = {ed: prev.edition, v: mk ? mk[1] : null}; }
    delete r.nen;
    return r;
  });
}
function finalizeAttempts(S){
  if(!S.finished) return;
  useLineup(S);
  // remember bond partners who died, so later profiles can say so
  const dm = cmap(S); S.candidates.forEach(c => (c.bonds || []).forEach(b => { const o = dm[b.id]; if(o && o.status === 'Deceased' && !b.dead) b.dead = S.edition; }));
  (S.alliances || []).forEach(A => A.ever.forEach(id => { const c = cmap(S)[id]; if(c) c.pastAllies = [...new Set((c.pastAllies || []).concat(A.ever.filter(x => x !== id)))]; }));
  S.candidates.forEach(c => {
    const at = (c.attempts || []).find(x => x.edition === S.edition);
    if(!at || at.status === 'Completed') return;
    const ph = c.status === 'Approved' ? PHASES.length - 1 : (c.out ?? PHASES.length - 1);
    at.phase = ph; at.phaseName = PHASES[ph].name; at.phaseId = PHASES[ph].id; at.stage = PHASES[ph].stage;
    at.result = c.status === 'Approved' ? 'Licensed Hunter' : c.status;
    at.reason = c.status === 'Approved' ? c.reason : c.reason;
    at.status = 'Completed';
  });
}

let MATCH_TAG = null;   // during the Final, log lines are tagged with the match they belong to
// the sitting Chairman (set by the page); exam lines that mention "the Chairman" use the name
let CHAIR = null;
const chairT = t => !CHAIR || !t || t.indexOf('Chairman') < 0 ? t : pro(t.replace(/\bThe Chairman's\b/g, `${CHAIR.title || 'Chairman'} ${CHAIR.name}'s`).replace(/\b[Tt]he Chairman\b/g, `${CHAIR.title || 'Chairman'} ${CHAIR.name}`).replace(/\bhis dice\b/g, '{their} dice').replace(/ says he has /g, ' says {they} {have} '), CHAIR);
const proIds = (S, t, ids) => t && t.indexOf('{') >= 0 && ids && ids.length ? pro(t, S.candidates.find(c => c.id === ids[0])) : t;
// camp colour (type 'story'): a line told in the last couple of exams is usually skipped, and the rest get a scene or a reaction now and then, so the same sentence does not keep coming back
const ST_OPEN = ['At dawn,', 'Before anyone is properly awake,', 'During a short break,', 'Somewhere near the back,', 'While the examiner counts heads,', 'Halfway through,', 'As the light fades,', 'In a quiet moment,', 'Out of nowhere,', 'Around the fire that night,', 'Between two checkpoints,', 'Just before the signal,', 'While everyone else rests,', 'With nobody watching,', 'In full view of the examiners,', 'Over a cold breakfast,', 'On the way in,', 'Later, when it is quieter,'];
const ST_TAIL = ['Nobody comments.', 'A few people notice.', 'It does not go unnoticed.', 'Nobody is sure what to make of it.', 'The examiners exchange a look.', 'Half the camp pretends not to watch.', 'Nobody asks why.', 'Two people take notes.', 'Someone will remember it later.', 'The others pretend they did not see.'];
const ST_GRIM = /\b(die|dies|dead|death|blood|fear|afraid|pale|nightmare|farewell|kill|pray|grave|mourn|lost|wound|bleed|cry|cries|tears)/i;
const ST_STATE = /\b(has been|have been|grew up|was raised|were raised|comes from|come from|is the|has always|might as well|feels like|has already|is sure|was born|cannot|can't|can|never|always|it shows|twice as hard|fear of|examiners?)\b/i;
// how the trial ended for a few people worth following: a climb, a near miss, a slip
const CL_CLIMB = [o => `${o.c.name} was ${ordinal(o.pr)} of ${o.pn} after the ${o.prev}. ${o.P.They} finish${o.P.es} the ${o.ph} ${ordinal(o.r)}.`, o => `From ${ordinal(o.pr)} in the ${o.prev} to ${ordinal(o.r)} in the ${o.ph}: ${o.c.name} is waking up.`, o => `Nobody was watching ${o.c.name} after the ${o.prev}. After the ${o.ph}, everyone is.`];
const CL_HAIR = [o => `${o.c.name} makes the cut in the ${o.ph} by almost nothing.`, o => `${o.c.name} scrapes through the ${o.ph}. ${o.P.They} know${o.P.s} how close it was.`, o => `The examiner checks ${o.c.name}'s result twice. Through, barely.`, o => `${o.c.name} crosses the line in the ${o.ph} with nothing left, and nothing to spare.`];
const CL_SLIP = [o => `${o.c.name}, ${ordinal(o.pr)} after the ${o.prev}, gets through the ${o.ph} in ${ordinal(o.r)}. Something is off.`, o => `${o.c.name} drops from ${ordinal(o.pr)} to ${ordinal(o.r)} in the ${o.ph}. Still in, but rattled.`];
function trialCloser(S, ph, p, pool, passed, T, best){
  if(passed.length < 6) return;
  let prev = null; for(let q = p - 1; q >= 0; q--){ const id = PHASES[q].id; if(passed.filter(c => c.scores[id] != null).length > passed.length * 0.6){ prev = PHASES[q]; break; } }
  const rk = id => { const L = pool.filter(c => c.scores[id] != null).sort((x, y) => y.scores[id] - x.scores[id]); const m = new Map(L.map((c, i) => [c.id, i + 1])); return {m, n: L.length}; };
  const now = rk(ph.id), was = prev ? rk(prev.id) : null, out = [], seen = new Set([best && best.id]);
  const who = passed.filter(c => spNotable(c) && !seen.has(c.id));
  const add = (k, c, o) => { if(out.length >= 2 || seen.has(c.id) || out.some(x => x.k === k)) return; seen.add(c.id); out.push({k, c, o}); };
  if(was){
    who.filter(c => was.m.has(c.id)).forEach(c => { const pr = was.m.get(c.id), r = now.m.get(c.id); if(!r) return;
      if(pr / was.n >= 0.5 && r / now.n <= 0.08) add('climb', c, {pr, r});
      else if(pr / was.n <= 0.05 && r / now.n >= 0.6) add('slip', c, {pr, r}); });
  }
  who.filter(c => c.scores[ph.id] - T >= 0 && c.scores[ph.id] - T < 2).slice(0, 3).forEach(c => add('hair', c, {}));
  out.forEach(({k, c, o}) => { const X = {c, P: PR(c), ph: ph.name, prev: prev && prev.name, pn: was ? was.n.toLocaleString('en-US') : '', ...o};
    log(S, p, 'event', vpick(S, k === 'climb' ? CL_CLIMB : k === 'slip' ? CL_SLIP : CL_HAIR, c.id + k)(X), [c.id]); });
}
// routine alliance news among ordinary applicants only goes to the detailed log
const _cmC = new WeakMap();
function ordOnly(S, type, ids){
  if(!['ally', 'split', 'help'].includes(type) || !ids || !ids.length) return false;
  let m = _cmC.get(S); if(!m || m.n !== S.candidates.length){ m = {n: S.candidates.length, by: new Map(S.candidates.map(c => [c.id, c]))}; _cmC.set(S, m); }
  return ids.every(id => { const c = m.by.get(id); return c && c.tier === 'Ordinary' && !spNotable(c); });
}
function storyKey(S, text, ids){ let t = text; (ids || []).forEach(id => { const c = S.candidates.find(x => x.id === id); if(c){ t = t.split(c.name).join('~'); if(c.first) t = t.split(c.first).join('~'); } }); PHASES.forEach(ph => { t = t.split(ph.name).join('§'); }); return nhash(t.replace(/\d+/g, '#').slice(0, 70)).toString(36); }
function storyLine(S, text, ids){
  if(!text || text.indexOf('"') >= 0 || text.indexOf('“') >= 0) return text;   // named things (nicknames, quotes) always stay as they are
  const k = storyKey(S, text, ids), M = S.smem = S.smem || {}, seen = M[k], h = nhash(S.seed + ':' + k + ':' + S.log.length);
  if(seen === S.edition) return null;   // never twice in one exam
  if(seen !== undefined && S.edition - seen <= 2 && h % 10 < 7) return null;
  M[k] = S.edition;
  const one = (text.match(/[.!?](\s|$)/g) || []).length === 1, first = text.split(' ')[0], named = (ids || []).some(id => { const c = S.candidates.find(x => x.id === id); return c && text.startsWith(c.first || c.name); });
  const r = (h >>> 8) % 100;
  if(r < 26 && one && !ST_STATE.test(text) && !/^(At|Before|After|By|During|In|On|When|While|Halfway|Somewhere|From|Last|This|Every|Nobody|Everyone|Someone|Two|Three)\b/.test(text) && !/:/.test(text.slice(0, 30)))
    return `${ST_OPEN[(h >>> 4) % ST_OPEN.length]} ${named || /^[A-Z][a-z]+ [A-Z]/.test(text) ? text : text.charAt(0).toLowerCase() + text.slice(1)}`;
  if(r >= 26 && r < 42 && one && named && !ST_STATE.test(text) && !ST_GRIM.test(text)) return `${text} ${ST_TAIL[(h >>> 4) % ST_TAIL.length]}`;
  return text;
}
function log(S, p, type, text, ids, detail){ if(!detail && ordOnly(S, type, ids)) detail = true; if(type === 'story' && !detail){ text = storyLine(S, text, ids); if(text === null) return; } const e = {p, type, text: chairT(proIds(S, text, ids)), ids: ids || [], d: !!detail}; if(MATCH_TAG) e.mt = MATCH_TAG; S.log.push(e); if(typeof castNote === 'function') castNote(S, e); }


/* ---------- how a candidate's exam ended, told as a moment: the trial's own scene, then one detail that is theirs ---------- */
// c.reason stays the short cause (it groups the "how they were eliminated" list); c.fall is the line people read
const FALL_SC = {
  sea: {endurance: ['{F} spent the storm night over the rail and was set ashore at the first harbour, grey to the lips.', 'Three days without keeping food down. The captain put {F} on the pilot boat without a word.'],
    courage: ['When the mast cracked, {F} locked {themselves} in the hold and would not come out until port.', '{F} begged the crew to turn back in the worst of the storm. They turned back for {them}, and only {them}.'],
    teamwork: ['{F} would not take a turn at the pumps. The crew voted {them} off at the next stop.', 'The bosun asked for hands on the ropes; {F} kept {their} hands in {their} pockets, and was left on the dock.']},
  quiz: {intelligence: ['{F} gave the old woman a clever answer. Clever was the wrong answer.', '{F} argued the dilemma like a lawyer. The old woman simply pointed back down the road.'],
    perception: ['{F} answered in the first second. Everyone who passed had said nothing at all.', '{F} never noticed the examiner was counting the silences, not the answers.']},
  disguise: {perception: ['{F} followed the friendliest guide into the forest. It smiled with too many teeth.', 'The guide {F} trusted had no shadow. {F} noticed at dusk, far too late.'],
    intelligence: ['Two guides, one face. {F} picked the wrong one and walked in circles until dark.', '{F} tried to out-think the Kiriko. They had been fooling candidates for a hundred years.']},
  nighttrain: {perception: ['The conductor punched every ticket but {F}\'s, and {F} never asked why. The train left {them} at a dark station.', '{F} slept through the one carriage that mattered and woke up at the end of the line.'],
    courage: ['When the bandits came through the carriage, {F} went out the window.', '{F} pulled the emergency brake at the first gunshot and walked the rest of the way home.'],
    strategy: ['{F} doubled down at the card table, then doubled down again. {Their} ticket ended up in a stranger\'s pocket.', 'A friendly game in the dining car. {F} lost {their} ticket on the last hand.']},
  cliffpath: {agility: ['A loose stone, one step too far out. {F} slid twenty metres and the climb was over.', '{F} reached for a handhold that wasn\'t there and was carried back down on a stretcher.'],
    courage: ['{F} looked down from the rope bridge once, and could not take another step.', 'The bridge swayed in the wind; {F} turned around halfway across.'],
    endurance: ['The air thinned and {F}\'s legs went with it. {They} sat on the path and watched the others climb.', '{F} made it to the last switchback and no further.']},
  marathon: {endurance: ['Somewhere past the eightieth kilometre, {F} stopped feeling {their} feet, then stopped running.', '{F} leaned on the tunnel wall to catch {their} breath. When {they} looked up, the lights were gone.'],
    speed: ['The examiner never ran fast, only forever. {F} lost sight of his back in the third tunnel.', '{F} was still in the tunnels when the stairs to the surface closed.'],
    determination: ['When the examiner sped up, {F} simply stopped. Nobody came back for {them}.', '{F} decided, somewhere in the dark, that this was not {their} year.']},
  stairs: {endurance: ['{F} counted the steps for an hour, then stopped counting, then stopped climbing.', 'Halfway up, {F} sat down "just for a moment". The moment lasted until the doors closed.'],
    strength: ['{F}\'s legs locked on the endless steps. {They} crawled for a while. It was not enough.', 'Cramp took {F}\'s thighs on the last flight; {they} watched the top from twenty steps below.'],
    determination: ['{F} sat on a step and told the next candidate to go on without {them}. {They} meant it.', 'The staircase never ended, so {F} decided to end it {themselves}.']},
  wetlands: {perception: ['A second examiner appeared in the mist, smiling. {F} followed him into the reeds and was never seen at the finish.', '{F} trusted the voice calling from the fog. The swamp had learned to talk.'],
    agility: ['{F} stepped on a log that blinked. The mud took {them} to the waist before the rescuers did.', 'One wrong step in the mud, then another. {F} was hauled out by the examiners, and out of the exam.'],
    courage: ['The wetland predators circled once. {F} ran the wrong way, back to the start.', '{F} froze when the swamp started moving, and stayed frozen until it was over.']},
  desert: {endurance: ['The heat took {F} on the second dune. {They} woke up in the shade of a rescue tent.', '{F} kept walking until {they} didn\'t. The examiners found {them} by {their} footprints.'],
    determination: ['{F} saw the oasis on the horizon, then saw it vanish, and turned back.', 'The first mirage broke something in {F}. {They} walked back to the start alone.'],
    strategy: ['{F} drank half the water by noon. By sunset there was none, and no one to share.', 'A bad bargain at the first well: {F} traded {their} water for a map that led nowhere.']},
  nighthunt: {perception: ['The examiner\'s lantern turned a corner and became a firefly. {F} chased the firefly.', '{F} blinked at the wrong moment. In that forest, that was enough.'],
    speed: ['The trees were too close and the examiner too fast. {F} ran into the dark alone.', '{F} could hear the others ahead, then only {their} own breathing.'],
    courage: ['The forest started howling and {F} stopped running. The howling stopped too, eventually.', '{F} climbed a tree to wait for the howling to pass. The chase passed instead.']},
  mountain: {strength: ['{F} hung from the ledge for a long minute, then let go into the safety net.', 'The last ledge needed one more pull. {F}\'s arms did not have it.'],
    endurance: ['{F} stopped a hundred metres short of the summit, bent over, sucking at the thin air.', 'The altitude found {F} first. {They} came down on a sled.'],
    agility: ['Ice under fresh snow. {F} slid back to the second camp and the rope went taut.', '{F}\'s crampon caught {their} own trouser leg on the ice wall. It was a long way down.']},
  capture: {strength: ['{F} got a rope around a Great Stamp. The Great Stamp got {F} around a tree.', '{F} wrestled the beast for an hour and came back with only {their} own bruises.'],
    agility: ['{F} jumped for the horns and missed. The herd went over {them} like thunder.', 'A Great Stamp turned faster than {F} did.'],
    strategy: ['{F} chased the whole herd at once and caught none of it.', 'No plan, no trap, no prey. {F} came back with mud to the knees and empty hands.']},
  cooking: {intelligence: ['The examiner took one bite of {F}\'s dish and pushed the plate away.', '{F} served what {they} thought was sushi. The examiner called it a crime.'],
    perception: ['{F} cooked a perfect dish. It was not the dish the examiner wanted.', 'The examiner asked for something simple. {F} heard "spectacular".'],
    agility: ['{F}\'s knife work took so long the rice went cold on the counter.', 'A slip of the knife, a bandaged thumb, an empty plate when time was called.']},
  egg: {courage: ['{F} stood at the edge of the ravine until everyone else had jumped, and then walked back.', '{F} looked down at the spider-silk web and could not let go of the cliff.'],
    agility: ['{F} jumped, missed the web by an arm\'s length and was fished out of the river below.', 'The web caught {F} by one boot. The egg fell without {them}.'],
    perception: ['{F} jumped on the wrong gust. The updraft went left; {F} went down.', '{F} grabbed an egg, missed the updraft and had to drop it to climb out.']},
  auction: {intelligence: ['{F} paid a fortune for a painting the examiner had forged that morning.', 'The lot looked perfect. That was the problem, and {F} missed it.'],
    charisma: ['{F} raised {their} paddle six times and was outbid six times, by smiles.', 'Nobody at the table would deal with {F}. The gavel fell for everyone else.'],
    strategy: ['{F} spent everything on the first lot and watched the real prizes go by.', 'An early bidding war with a rival left {F} with one trinket and no budget.']},
  beast: {courage: ['The beast lowered its head once and {F} let go of the rope.', '{F} reached out a hand and pulled it back. The beast noticed, and walked away.'],
    charisma: ['{F} talked to the creature the whole afternoon. It never once looked back.', 'The creature sniffed {F}\'s hand, snorted, and chose someone else.'],
    agility: ['{F} got on its back for three seconds. The fourth was the ground.', 'The beast rolled; {F} did not roll fast enough.']},
  treasure: {perception: ['{F} sat on the hidden cache to eat lunch and never knew.', 'The cache was under the marker stone. {F} read the stone twice and kept walking.'],
    intelligence: ['The map was upside down for an hour before {F} noticed. Then it was dark.', '{F} decoded the map perfectly, for the wrong island.'],
    determination: ['{F} dug until sunset, gave up, and the next candidate found the chest a spade below.', 'Three empty holes and {F} put the shovel down for good.']},
  prisoner: {}, guardians: {}, bandits: {},
  centennial: {endurance: ['{F} reached the hundredth stair on {their} knees and could not stand to take it.', 'One stair for every exam before {them}. {F} ran out of legs at ninety-one.'],
    courage: ['{F} read the names on the gate, one of them familiar, and turned around.', 'The gate of names asked {F} to add {their} own. {F} would not.'],
    strategy: ['At the fork of a hundred years {F} chose the old road. It ended in a wall.', '{F} followed the map of a Hunter long dead. The road had moved since.'],
    perception: ['The hidden exit was in plain sight. {F} walked past it twice.', '{F} searched the whole hall for a door and never looked up.'],
    determination: ['{F} sat beside the old stone to rest and stayed there with it.', 'The centennial trial asked how badly {F} wanted it. Not badly enough, today.']}
};
// a team that lost because one member would not work with it: each trial its own way
const FALL_LONER = {
  tower: ['{L} refused every vote on the third floor. Team {T} was still arguing over the doors when the 72 hours ran out.', 'Every majority vote stalled on {L}. Team {T} spent two days at the same lever.'],
  maze: ['{L} kept the map and would not share it. Team {T} was still circling the third fork when the doors sealed.', '{L} walked off alone at the first split, and took the only lamp. Team {T} never found the exit.'],
  raft: ['{L} would not paddle on the count. The raft spun at the second drop, and the clock ran out with team {T} still in the shallows.', '{L} sat in the stern and refused to row. Team {T} drifted, then capsized.'],
  _: ['{L} would not cooperate, and team {T} paid for it with every hour.']
};
const FALL_LONER_SELF = ['{F} would not take orders from anyone, and team {T} ran out of time arguing with {them}.', 'The team needed one vote from {F}. It never came, and neither did the exit.'];
const FALL_TEAM = {
  tower: {intelligence: ['Team {T} never solved the floor with the moving walls. {W} swore it was a trick. It was.', 'Team {T} read the tower\'s rules three times and still pulled the wrong lever.'],
    strategy: ['Team {T} chose the long route because it looked safe. It was safe, and seventy-four hours long.', 'Team {T} burned a day on a shortcut that led back to the top.'],
    teamwork: ['Team {T} split every vote down the middle, for three days.', 'Team {T} stopped speaking to each other on the second floor and never started again.']},
  maze: {intelligence: ['Team {T} drew the labyrinth on the wall and still could not see the pattern.', 'The labyrinth repeated itself. Team {T} did not notice until the second night.'],
    perception: ['Team {T} walked past the same scratched mark eleven times.', 'The exit was behind a draught team {T} never felt.'],
    teamwork: ['Team {T} split up to cover more ground and spent the last day looking for each other.', 'Team {T} argued at every fork. The labyrinth waited.']},
  raft: {strength: ['The rapids tore the oars out of team {T}\'s hands. They walked the rest of the way, too slowly.', 'Team {T} could not hold the raft straight; the river took them sideways into the rocks.'],
    teamwork: ['Team {T} paddled against each other at the narrows and went over.', 'Two shouted left, two shouted right. Team {T} capsized arguing.'],
    courage: ['Team {T} pulled ashore above the waterfall and would not go on.', 'Team {T} looked at the falls for an hour, then started walking. The delta was too far on foot.']}
};
// prisoner, guardian and bandit challenges: two losses, told against who beat them
const FALL_DUEL = {
  Combat: ['was put on the floor by {N}', 'could not get past {N}\'s guard', 'was beaten bloody by {N}'],
  Riddle: ['could not answer {N}\'s riddle', 'gave {N} the obvious answer', 'was out-thought by {N}'],
  Wager: ['bet the hours against {N} and lost them', 'was bluffed by {N}', 'lost a coin toss {N} had rigged']
};
const NPC_EPI = {
  Bendot: 'a bomber with a century left to serve', Sedokan: 'who has not lost a riddle in forty years', Majitani: 'a big talker with a scarred face', Johness: 'the one the guards will not name', Leroute: 'a gambler who never loses a wager',
  Tompa: 'a smiling con man', Brodo: 'a former pit fighter', Gazul: 'a strangler serving life', Murk: 'a forger who never raises his voice', Vexa: 'a card sharp from the southern ports', 'Old Kreel': 'the oldest prisoner in the tower',
  Sabbath: 'a cult leader with a gentle voice', Dorran: 'a bare-knuckle champion turned killer', Grisette: 'a poisoner with perfect manners', Hask: 'who counts his sentence in riddles solved',
  'Stone Warden': 'a guardian who does not blink', 'Old Sphinx': 'the labyrinth\'s oldest riddler', 'Mirror Knight': 'who fights with your own moves', 'Lamp Keeper': 'who guards the only light', 'Twin Masks': 'two guardians who speak as one',
  'Grey Hound': 'a guardian faster than he looks', 'The Locksmith': 'who keeps every door', 'Gatekeeper Ume': 'who bets on every door', 'Brass Golem': 'a guardian of metal and patience',
  'One-Eye Rourk': 'the bandit chief', 'The Ferryman': 'who charges for every crossing', 'Salt Jack': 'a bandit with loaded dice', 'Mad Coral': 'a bandit who fights laughing', 'Hook Ilsa': 'a bandit with a riddle for every toll',
  'Captain Dredge': 'who runs the river', 'Brine Sister': 'a bandit nobody has beaten twice', 'Old Weasel': 'a bandit who bets on anything'
};
const npcIntro = n => NPC_EPI[n] ? `${n}, ${NPC_EPI[n]},` : n;
// two losses of the same kind read as one defeat; two kinds as one after another
const FALL_DUEL2 = {Combat: ['{F} fought {A}, then {B}, and lost both.', '{A} put {F} on the floor, and {B} did it again.'], Riddle: ['{F} sat down for two riddles, with {A} and then {B}, and answered neither.', 'Two riddles, from {A} and from {B}. {F} had an answer for neither.'], Wager: ['{F} gambled against {A}, then {B}, and lost the hours both times.', 'Two wagers, against {A} and then {B}, and {F} lost them both.']};
const FALL_DUEL_END = {prisoner: 'The penalty hours did the rest.', guardians: 'The guardians\' doors stayed shut.', bandits: 'The bandits kept {their} hours as toll.', _: 'The time penalties ran out the clock.'};
// one detail that is theirs: the injury they carried, what wore them out, who sabotaged them, their nature, an ally who made it
const FALL_TRAIT = {
  'Daredevil': {agility: ['Jumped first, as always. This time there was nothing to land on.'], strength: ['Jumped first, as always. This time there was nothing to land on.']},
  'Coward': {courage: ['{F} had run from smaller things.']},
  'Lone Wolf': {teamwork: ['Nobody offered to help, and {F} never asked.'], _: ['{F} did it alone, the way {they} always {do}.']},
  'Hot-headed': {_: ['{F} lost {their} temper before {they} lost the trial.']},
  'Glass Cannon': {endurance: ['Strong for an hour. The trial lasted ten.'], strength: 0},
  'Bookworm': {strength: ['The books had not prepared {them} for this.'], endurance: ['The books had not prepared {them} for this.'], agility: ['The books had not prepared {them} for this.']},
  'Schemer': {strategy: ['The plan was clever. The trial did not care.']},
  'Show-off': {_: ['Half of {F}\'s attention was on who was watching.']},
  'Survivor': {_: ['{F} got up every time but this one.']},
  'Stoic': {_: ['{F} said nothing about it, then or after.']},
  'Mastermind': {_: ['None of the plans in {their} head had this in it.']},
  'Brute': {intelligence: ['Hitting it would not have helped. {F} tried anyway.'], perception: ['Hitting it would not have helped. {F} tried anyway.']},
  'Sprinter': {endurance: ['{F} was first for an hour and last for the rest of it.']},
  'Charmer': {_: ['For once, a smile did not get {F} through.']}
};
function fallCtx(S, c, p, base, opt){
  opt = opt || {}; const L = [], m = cmap(S), F = c.first || c.name.split(' ')[0];
  if(c.sabBy && c.sabP === p && m[c.sabBy]) L.push([9, `It did not help that ${m[c.sabBy].name} had tampered with {their} gear the night before.`]);
  if(c.injury && c.injury.p < p) L.push([7, `The ${c.injury.w} from the ${c.injury.from} gave out first.`]);
  if(c.fatigue >= 55 && p > 0) L.push([5, `{They} had come in with nothing left from the ${PHASES[p - 1] ? PHASES[p - 1].name : 'last trial'}.`]);
  if(opt.hair) L.push([6, vpick(S, ['A few steps more and {they} would have made it.', 'By a hair. The examiner said so, which did not help.', 'Close enough to see the others pass. Not close enough to pass.'], c.id + 'h')]);
  const T = c.trait && FALL_TRAIT[c.trait]; if(T){ const k = opt.attr, v = (k && T[k]) || (k && T[k] === 0 ? null : T._); if(v) L.push([4, v[nhash(c.id + p) % v.length]]); }
  const al = alliesOf(S, c).filter(o => o.status === 'Active' || o.status === 'Finalist');
  // an ally only counts if the story already showed them together: say who they are to each other
  const A = allianceOf(S, c), since = o => { const j = A && A.joined && A.joined[o.id] != null ? A.joined[o.id] : A ? A.formed : null, jc = A && A.joined && A.joined[c.id] != null ? A.joined[c.id] : A ? A.formed : null; return Math.max(j ?? p, jc ?? p); };
  const met = o => S.log.some(x => x.p < p && x.ids && x.ids.includes(c.id) && x.ids.includes(o.id)) || (c.notes || []).some(n => n.p < p && n.text.includes(o.name));   // only someone the story already put beside them
  const al2 = al.filter(o => isRelative(o, c) || (since(o) < p && met(o)));
  if(al2.length && !opt.team){ const o = al2[0], s = since(o), rel = isRelative(o, c) ? kinOf(c, o) : A && A.lodge ? 'who trained in the same lodge' : PHASES[s] ? `{their} ally since the ${PHASES[s].name}` : `{their} ally`;
    L.push([3, [`${o.name}, ${rel}, made it through and looked back for {them}.`, `${o.name}, ${rel}, waited at the finish for {them}, longer than anyone needed to.`, `${o.name}, ${rel}, had to go on alone.`, `${o.name}, ${rel}, kept a place for {them} at the next camp. It stayed empty.`][nhash(c.id + o.id) % 4]]); }
  const rn = c.rescuedBy && (c.notes || []).filter(n => /rescued by/.test(n.text)).pop();
  if(rn && p - rn.p <= 2 && m[c.rescuedBy] && c.rescuedBy !== (al[0] || {}).id) L.push([2, `${m[c.rescuedBy].first || m[c.rescuedBy].name} had pulled {them} through once already. Not twice.`]);
  if(!L.length && c.motive != null && MOTIVES[c.motive] && nhash(c.id + 'mf' + p) % 3 === 0) L.push([1, MOTIVES[c.motive].fail]);
  if(!L.length) return '';
  L.sort((x, y) => y[0] - x[0]);
  return pro(L[0][1], c).replace(/\{F\}/g, F);
}
function setFall(S, c, p, scene, opt){
  const F = c.first || c.name.split(' ')[0];
  const s = pro(scene, c).replace(/\{F\}/g, F).replace(/,,/g, ',').replace(/,\./g, '.').replace(/,\s*,/g, ','), x = fallCtx(S, c, p, s, opt);
  c.fall = s + (x ? ' ' + x : ''); c.fallScene = s;
  if(c.attempts && c.attempts.length) c.attempts[c.attempts.length - 1].fall = c.fall;
}
const fallPick = (S, arr, salt) => vpick(S, arr, salt);

function eliminate(S, c, p, reason){ c.status = 'Eliminated'; c.out = p; c.reason = pro(reason, c); }

