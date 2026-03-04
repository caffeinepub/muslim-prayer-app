export interface Surah {
  number: number;
  arabic: string;
  transliteration: string;
  nameRu: string;
  verses: number;
  place: "Мекка" | "Медина";
  descriptionRu: string;
}

export const quranSurahs: Surah[] = [
  {
    number: 1,
    arabic: "الفاتحة",
    transliteration: "Al-Fatiha",
    nameRu: "Открывающая",
    verses: 7,
    place: "Мекка",
    descriptionRu:
      "Открывающая сура Корана — молитва-просьба о руководстве на прямой путь. Читается в каждом ракяте намаза.",
  },
  {
    number: 2,
    arabic: "البقرة",
    transliteration: "Al-Baqara",
    nameRu: "Корова",
    verses: 286,
    place: "Медина",
    descriptionRu:
      "Самая длинная сура Корана. Содержит законы об ибадате, пище, браке, разводе, долгах. Включает аят аль-Курси — великий аят о величии Аллаха.",
  },
  {
    number: 3,
    arabic: "آل عمران",
    transliteration: "Ali 'Imran",
    nameRu: "Семья Имрана",
    verses: 200,
    place: "Медина",
    descriptionRu:
      "Рассказывает о семье Имрана, рождении Марьям и Исы (Иисуса). Содержит призыв к единству мусульман и урок битвы при Ухуде.",
  },
  {
    number: 4,
    arabic: "النساء",
    transliteration: "An-Nisa",
    nameRu: "Женщины",
    verses: 176,
    place: "Медина",
    descriptionRu:
      "Подробные законы о правах женщин, наследстве, браке и справедливости в семье и обществе.",
  },
  {
    number: 5,
    arabic: "المائدة",
    transliteration: "Al-Ma'ida",
    nameRu: "Трапеза",
    verses: 120,
    place: "Медина",
    descriptionRu:
      "Законы о дозволенной пище, соблюдении договоров, справедливости. Упоминает историю о трапезе, посланной с небес Исе.",
  },
  {
    number: 6,
    arabic: "الأنعام",
    transliteration: "Al-An'am",
    nameRu: "Скот",
    verses: 165,
    place: "Мекка",
    descriptionRu:
      "Утверждение единобожия, опровержение многобожия. Разъяснение дозволенного и запретного в пище и поклонении.",
  },
  {
    number: 7,
    arabic: "الأعراف",
    transliteration: "Al-A'raf",
    nameRu: "Преграда",
    verses: 206,
    place: "Мекка",
    descriptionRu:
      "История пророков — Адама, Нуха, Худа, Салиха, Лута, Шуайба и Мусы. Описание Судного дня и преграды между раем и адом.",
  },
  {
    number: 8,
    arabic: "الأنفال",
    transliteration: "Al-Anfal",
    nameRu: "Трофеи",
    verses: 75,
    place: "Медина",
    descriptionRu:
      "Законы о военных трофеях и правилах джихада. Уроки победы в битве при Бадре.",
  },
  {
    number: 9,
    arabic: "التوبة",
    transliteration: "At-Tawba",
    nameRu: "Покаяние",
    verses: 129,
    place: "Медина",
    descriptionRu:
      "Единственная сура без Бисмиллы. Объявление о разрыве договоров с многобожниками, призыв к искреннему покаянию.",
  },
  {
    number: 10,
    arabic: "يونس",
    transliteration: "Yunus",
    nameRu: "Юнус",
    verses: 109,
    place: "Мекка",
    descriptionRu:
      "История пророка Юнуса (Ионы) и его народа. Утверждение права Аллаха на поклонение и тщетность многобожия.",
  },
  {
    number: 11,
    arabic: "هود",
    transliteration: "Hud",
    nameRu: "Худ",
    verses: 123,
    place: "Мекка",
    descriptionRu:
      "История пророка Худа и его народа Ад. Также истории Нуха, Салиха, Ибрагима, Лута, Шуайба и Мусы.",
  },
  {
    number: 12,
    arabic: "يوسف",
    transliteration: "Yusuf",
    nameRu: "Юсуф",
    verses: 111,
    place: "Мекка",
    descriptionRu:
      "Полная история пророка Юсуфа (Иосифа): от детства и предательства братьев до власти в Египте. Названа 'лучшей историей'.",
  },
  {
    number: 13,
    arabic: "الرعد",
    transliteration: "Ar-Ra'd",
    nameRu: "Гром",
    verses: 43,
    place: "Медина",
    descriptionRu:
      "Величие Аллаха в природных явлениях — дожде, громе, молнии. Напоминание о неизбежности Судного дня.",
  },
  {
    number: 14,
    arabic: "إبراهيم",
    transliteration: "Ibrahim",
    nameRu: "Ибрагим",
    verses: 52,
    place: "Мекка",
    descriptionRu:
      "Дуа пророка Ибрагима за Мекку и свою семью. Притча о добром и злом слове как о деревьях.",
  },
  {
    number: 15,
    arabic: "الحجر",
    transliteration: "Al-Hijr",
    nameRu: "Аль-Хиджр",
    verses: 99,
    place: "Мекка",
    descriptionRu:
      "История народов, отвергших пророков. Упоминание каменистой долины Хиджр. Обещание Аллаха сохранить Коран.",
  },
  {
    number: 16,
    arabic: "النحل",
    transliteration: "An-Nahl",
    nameRu: "Пчёлы",
    verses: 128,
    place: "Мекка",
    descriptionRu:
      "Знамения Аллаха в природе, в том числе в пчёлах и мёде. Запрет на запрещённое и повеление справедливости.",
  },
  {
    number: 17,
    arabic: "الإسراء",
    transliteration: "Al-Isra",
    nameRu: "Ночное путешествие",
    verses: 111,
    place: "Мекка",
    descriptionRu:
      "Описание Исра — ночного путешествия Пророка из Мекки в Иерусалим. Десять заповедей ислама. История сынов Израилевых.",
  },
  {
    number: 18,
    arabic: "الكهف",
    transliteration: "Al-Kahf",
    nameRu: "Пещера",
    verses: 110,
    place: "Мекка",
    descriptionRu:
      "Четыре истории: люди пещеры, владелец двух садов, Муса и Хидр, Зуль-Карнайн. Рекомендуется читать каждую пятницу.",
  },
  {
    number: 19,
    arabic: "مريم",
    transliteration: "Maryam",
    nameRu: "Мариям",
    verses: 98,
    place: "Мекка",
    descriptionRu:
      "История рождения Яхьи (Иоанна) и Исы (Иисуса). Прославление Марьям (Марии) как лучшей женщины.",
  },
  {
    number: 20,
    arabic: "طه",
    transliteration: "Ta-Ha",
    nameRu: "Та Ха",
    verses: 135,
    place: "Мекка",
    descriptionRu:
      "История Мусы: горящий куст, избрание пророком, противостояние фараону, история Самири и золотого тельца.",
  },
  {
    number: 21,
    arabic: "الأنبياء",
    transliteration: "Al-Anbiya",
    nameRu: "Пророки",
    verses: 112,
    place: "Мекка",
    descriptionRu:
      "Упоминание многих пророков: Ибрагима, Лута, Нуха, Дауда, Сулеймана, Аюба, Юнуса, Закарии, Марьям и Исы.",
  },
  {
    number: 22,
    arabic: "الحج",
    transliteration: "Al-Hajj",
    nameRu: "Хадж",
    verses: 78,
    place: "Медина",
    descriptionRu:
      "Законы и духовный смысл хаджа. Описание Судного дня. Разрешение джихада для защиты.",
  },
  {
    number: 23,
    arabic: "المؤمنون",
    transliteration: "Al-Mu'minun",
    nameRu: "Верующие",
    verses: 118,
    place: "Мекка",
    descriptionRu:
      "Качества истинных верующих: смирение в намазе, целомудрие, верность. История сотворения человека.",
  },
  {
    number: 24,
    arabic: "النور",
    transliteration: "An-Nur",
    nameRu: "Свет",
    verses: 64,
    place: "Медина",
    descriptionRu:
      "Законы целомудрия и скромности. Аят Нур — знаменитый аят о свете Аллаха. История клеветы на Аишу.",
  },
  {
    number: 25,
    arabic: "الفرقان",
    transliteration: "Al-Furqan",
    nameRu: "Различение",
    verses: 77,
    place: "Мекка",
    descriptionRu:
      "Коран как различие между истиной и ложью. Описание качеств рабов Милостивого (ибадур-рахман).",
  },
  {
    number: 26,
    arabic: "الشعراء",
    transliteration: "Ash-Shu'ara",
    nameRu: "Поэты",
    verses: 227,
    place: "Мекка",
    descriptionRu:
      "Истории Мусы, Ибрагима, Нуха, Худа, Салиха, Лута, Шуайба. Различие между истинным пророком и лжепоэтом.",
  },
  {
    number: 27,
    arabic: "النمل",
    transliteration: "An-Naml",
    nameRu: "Муравьи",
    verses: 93,
    place: "Мекка",
    descriptionRu:
      "История Сулеймана и царицы Савской. Муравьи, говорящие птицы. Чудеса пророков Мусы и Салиха.",
  },
  {
    number: 28,
    arabic: "القصص",
    transliteration: "Al-Qasas",
    nameRu: "Повествование",
    verses: 88,
    place: "Мекка",
    descriptionRu:
      "Подробная история Мусы от рождения до пророчества. История богача Карун, погубленного гордыней.",
  },
  {
    number: 29,
    arabic: "العنكبوت",
    transliteration: "Al-'Ankabut",
    nameRu: "Паук",
    verses: 69,
    place: "Мекка",
    descriptionRu:
      "Испытания верующих. Непрочность многобожия — как паутина паука. Истории Ибрагима, Лута, Нуха, Шуайба.",
  },
  {
    number: 30,
    arabic: "الروم",
    transliteration: "Ar-Rum",
    nameRu: "Римляне",
    verses: 60,
    place: "Мекка",
    descriptionRu:
      "Пророчество о победе Рима над Персией. Знамения Аллаха в природе, предсказание воскрешения.",
  },
  {
    number: 31,
    arabic: "لقمان",
    transliteration: "Luqman",
    nameRu: "Лукман",
    verses: 34,
    place: "Мекка",
    descriptionRu:
      "Мудрые наставления Лукмана своему сыну: единобожие, почитание родителей, скромность, терпение.",
  },
  {
    number: 32,
    arabic: "السجدة",
    transliteration: "As-Sajda",
    nameRu: "Земной поклон",
    verses: 30,
    place: "Мекка",
    descriptionRu:
      "Доказательства единобожия. Описание рая и ада. Призыв к земному поклону перед Аллахом.",
  },
  {
    number: 33,
    arabic: "الأحزاب",
    transliteration: "Al-Ahzab",
    nameRu: "Союзники",
    verses: 73,
    place: "Медина",
    descriptionRu:
      "Битва у рва (Хандак) против союзников. Законы о браке Пророка, поведении жён Пророка, хиджабе.",
  },
  {
    number: 34,
    arabic: "سبأ",
    transliteration: "Saba",
    nameRu: "Саба",
    verses: 54,
    place: "Мекка",
    descriptionRu:
      "История царства Саба и его гибели из-за неблагодарности. Пророчество о Судном дне.",
  },
  {
    number: 35,
    arabic: "فاطر",
    transliteration: "Fatir",
    nameRu: "Творец",
    verses: 45,
    place: "Мекка",
    descriptionRu:
      "Аллах — единственный Творец и Покровитель. Знамения в природе. Три группы людей по отношению к Корану.",
  },
  {
    number: 36,
    arabic: "يس",
    transliteration: "Ya-Sin",
    nameRu: "Йа Син",
    verses: 83,
    place: "Мекка",
    descriptionRu:
      "Называется 'сердцем Корана'. Доказательства воскрешения из мёртвых. История жителей города, убивших посланника.",
  },
  {
    number: 37,
    arabic: "الصافات",
    transliteration: "As-Saffat",
    nameRu: "Выстроившиеся в ряды",
    verses: 182,
    place: "Мекка",
    descriptionRu:
      "Ангелы в рядах перед Аллахом. Истории Ибрагима, Исмаила, Мусы, Ильяса, Лута и Юнуса.",
  },
  {
    number: 38,
    arabic: "ص",
    transliteration: "Sad",
    nameRu: "Сад",
    verses: 88,
    place: "Мекка",
    descriptionRu:
      "История пророков Дауда, Сулеймана и Аюба. Суд Дауда. Высокомерие Иблиса и его проклятие.",
  },
  {
    number: 39,
    arabic: "الزمر",
    transliteration: "Az-Zumar",
    nameRu: "Толпы",
    verses: 75,
    place: "Мекка",
    descriptionRu:
      "Искренность поклонения только Аллаху. Толпы грешников и верующих в День суда. Призыв к покаянию.",
  },
  {
    number: 40,
    arabic: "غافر",
    transliteration: "Ghafir",
    nameRu: "Прощающий",
    verses: 85,
    place: "Мекка",
    descriptionRu:
      "Верующий из рода фараона защищает Мусу. Аллах — Прощающий грехи и Принимающий покаяние.",
  },
  {
    number: 41,
    arabic: "فصلت",
    transliteration: "Fussilat",
    nameRu: "Разъяснённые",
    verses: 54,
    place: "Мекка",
    descriptionRu:
      "Коран — ясно изложенные аяты. Судьба народов Ад и Самуд. Свидетельство органов тела в Судный день.",
  },
  {
    number: 42,
    arabic: "الشورى",
    transliteration: "Ash-Shura",
    nameRu: "Совет",
    verses: 53,
    place: "Мекка",
    descriptionRu:
      "Верующие решают дела через взаимный совет (шура). Откровение как единственный способ познать Аллаха.",
  },
  {
    number: 43,
    arabic: "الزخرف",
    transliteration: "Az-Zukhruf",
    nameRu: "Украшения",
    verses: 89,
    place: "Мекка",
    descriptionRu:
      "Отвержение многобожия и тех, кто следует предкам вслепую. История Ибрагима и Исы как слуг Аллаха.",
  },
  {
    number: 44,
    arabic: "الدخان",
    transliteration: "Ad-Dukhan",
    nameRu: "Дым",
    verses: 59,
    place: "Мекка",
    descriptionRu:
      "Знамение дыма как наказания перед концом света. История фараона и его гибели. Описание рая.",
  },
  {
    number: 45,
    arabic: "الجاثية",
    transliteration: "Al-Jathiya",
    nameRu: "Преклонившая колени",
    verses: 37,
    place: "Мекка",
    descriptionRu:
      "Все народы преклонят колени перед Аллахом. Знамения в природе. Спор между верующими и неверующими.",
  },
  {
    number: 46,
    arabic: "الأحقاف",
    transliteration: "Al-Ahqaf",
    nameRu: "Пески",
    verses: 35,
    place: "Мекка",
    descriptionRu:
      "Гибель народа Ад в пустыне Ахкаф. Наставление почитать родителей. Джинны слушают Коран.",
  },
  {
    number: 47,
    arabic: "محمد",
    transliteration: "Muhammad",
    nameRu: "Мухаммад",
    verses: 38,
    place: "Медина",
    descriptionRu:
      "Закон о военнопленных. Призыв к джихаду ради Аллаха. Лицемеры, не желающие воевать.",
  },
  {
    number: 48,
    arabic: "الفتح",
    transliteration: "Al-Fath",
    nameRu: "Победа",
    verses: 29,
    place: "Медина",
    descriptionRu:
      "Худайбийское перемирие как явная победа. Видение о взятии Мекки. Качества сподвижников Пророка.",
  },
  {
    number: 49,
    arabic: "الحجرات",
    transliteration: "Al-Hujurat",
    nameRu: "Комнаты",
    verses: 18,
    place: "Медина",
    descriptionRu:
      "Этика поведения с Пророком и верующими. Запрет насмешек и сплетен. Истинная вера — в делах, а не словах.",
  },
  {
    number: 50,
    arabic: "ق",
    transliteration: "Qaf",
    nameRu: "Каф",
    verses: 45,
    place: "Мекка",
    descriptionRu:
      "Доказательства воскрешения и Судного дня. Два ангела записывают дела. Смерть и предстояние перед Аллахом.",
  },
  {
    number: 51,
    arabic: "الذاريات",
    transliteration: "Adh-Dhariyat",
    nameRu: "Рассеивающие",
    verses: 60,
    place: "Мекка",
    descriptionRu:
      "Ветры как знамения. Истории Ибрагима, Мусы, Худа и Нуха. Цель создания людей — поклонение Аллаху.",
  },
  {
    number: 52,
    arabic: "الطور",
    transliteration: "At-Tur",
    nameRu: "Гора",
    verses: 49,
    place: "Мекка",
    descriptionRu:
      "Клятва горой Тур, Книгой и домом. Неизбежность наказания для отвергших истину. Описание рая.",
  },
  {
    number: 53,
    arabic: "النجم",
    transliteration: "An-Najm",
    nameRu: "Звезда",
    verses: 62,
    place: "Мекка",
    descriptionRu:
      "Откровение Пророку через Джибриля. Опровержение идолов. Всё у Аллаха — и мелкое, и великое.",
  },
  {
    number: 54,
    arabic: "القمر",
    transliteration: "Al-Qamar",
    nameRu: "Луна",
    verses: 55,
    place: "Мекка",
    descriptionRu:
      "Расщепление луны как знамение. Истории Нуха, Худа, Самуда, Лута и фараона. Коран — лёгкий для запоминания.",
  },
  {
    number: 55,
    arabic: "الرحمن",
    transliteration: "Ar-Rahman",
    nameRu: "Милостивый",
    verses: 78,
    place: "Медина",
    descriptionRu:
      "Перечисление благ Аллаха с рефреном: 'Какое же из благ Господа вашего вы отрицаете?' Описание двух садов рая.",
  },
  {
    number: 56,
    arabic: "الواقعة",
    transliteration: "Al-Waqi'a",
    nameRu: "Событие",
    verses: 96,
    place: "Мекка",
    descriptionRu:
      "Три группы людей в Судный день: приближённые, правая сторона, левая сторона. Описание рая и ада.",
  },
  {
    number: 57,
    arabic: "الحديد",
    transliteration: "Al-Hadid",
    nameRu: "Железо",
    verses: 29,
    place: "Медина",
    descriptionRu:
      "Призыв жертвовать ради Аллаха. Железо — знамение и польза людям. Монашество не предписано в исламе.",
  },
  {
    number: 58,
    arabic: "المجادلة",
    transliteration: "Al-Mujadila",
    nameRu: "Препирающаяся",
    verses: 22,
    place: "Медина",
    descriptionRu:
      "Женщина спорит с Пророком о разводе через зихар. Законы о тайных беседах. Запрет дружбы с врагами Аллаха.",
  },
  {
    number: 59,
    arabic: "الحشر",
    transliteration: "Al-Hashr",
    nameRu: "Сбор",
    verses: 24,
    place: "Медина",
    descriptionRu:
      "Изгнание иудейского племени Бану Надир из Медины. Распределение добычи. Описание Аллаха через Его имена.",
  },
  {
    number: 60,
    arabic: "الممتحنة",
    transliteration: "Al-Mumtahana",
    nameRu: "Испытуемая",
    verses: 13,
    place: "Медина",
    descriptionRu:
      "Запрет дружбы с врагами Аллаха. Испытание женщин-переселенок. Ибрагим — пример отречения от многобожников.",
  },
  {
    number: 61,
    arabic: "الصف",
    transliteration: "As-Saff",
    nameRu: "Ряд",
    verses: 14,
    place: "Медина",
    descriptionRu:
      "Призыв к единству и борьбе за дело Аллаха. Иса (Иисус) предсказывал приход Мухаммада. Торговля, спасающая от ада.",
  },
  {
    number: 62,
    arabic: "الجمعة",
    transliteration: "Al-Jumu'a",
    nameRu: "Пятница",
    verses: 11,
    place: "Медина",
    descriptionRu:
      "Обязательность пятничной молитвы. Призыв оставить торговлю ради молитвы. Упрёк иудеям, не следующим Торе.",
  },
  {
    number: 63,
    arabic: "المنافقون",
    transliteration: "Al-Munafiqun",
    nameRu: "Лицемеры",
    verses: 11,
    place: "Медина",
    descriptionRu:
      "Разоблачение лицемеров в Медине, их ложные клятвы. Призыв не отвлекаться от поминания Аллаха.",
  },
  {
    number: 64,
    arabic: "التغابن",
    transliteration: "At-Taghabun",
    nameRu: "Взаимный обман",
    verses: 18,
    place: "Медина",
    descriptionRu:
      "В Судный день обнаружится взаимный обман. Испытание в имуществе и детях. Прощение и щедрость к семье.",
  },
  {
    number: 65,
    arabic: "الطلاق",
    transliteration: "At-Talaq",
    nameRu: "Развод",
    verses: 12,
    place: "Медина",
    descriptionRu:
      "Подробные законы о разводе и идде (выжидательном сроке). Призыв бояться Аллаха в семейных отношениях.",
  },
  {
    number: 66,
    arabic: "التحريم",
    transliteration: "At-Tahrim",
    nameRu: "Запрещение",
    verses: 12,
    place: "Медина",
    descriptionRu:
      "История о запрете Пророком дозволенного из-за жён. Пример жён фараона и Марьям как образцов для верующих.",
  },
  {
    number: 67,
    arabic: "الملك",
    transliteration: "Al-Mulk",
    nameRu: "Власть",
    verses: 30,
    place: "Мекка",
    descriptionRu:
      "Аллах — Владыка, создавший смерть и жизнь для испытания. Звёзды — украшение неба и защита от шайтанов. Спасает от мучений могилы.",
  },
  {
    number: 68,
    arabic: "القلم",
    transliteration: "Al-Qalam",
    nameRu: "Перо",
    verses: 52,
    place: "Мекка",
    descriptionRu:
      "Клятва пером. Опровержение обвинений в безумии Пророка. История владельцев сада, наказанных за жадность.",
  },
  {
    number: 69,
    arabic: "الحاقة",
    transliteration: "Al-Haqqa",
    nameRu: "Неизбежное",
    verses: 52,
    place: "Мекка",
    descriptionRu:
      "Неизбежность Судного дня. Судьба народов Самуд, Ад и фараона. Вручение книги деяний правой или левой рукой.",
  },
  {
    number: 70,
    arabic: "المعارج",
    transliteration: "Al-Ma'arij",
    nameRu: "Ступени восхождения",
    verses: 44,
    place: "Мекка",
    descriptionRu:
      "Аллах — Владыка ступеней восхождения. Терпение верующего. Качества тех, кто войдёт в рай.",
  },
  {
    number: 71,
    arabic: "نوح",
    transliteration: "Nuh",
    nameRu: "Нух",
    verses: 28,
    place: "Мекка",
    descriptionRu:
      "Пророк Нух призывал народ к единобожию 950 лет. Его молитва против неверующих. История потопа.",
  },
  {
    number: 72,
    arabic: "الجن",
    transliteration: "Al-Jinn",
    nameRu: "Джинны",
    verses: 28,
    place: "Мекка",
    descriptionRu:
      "Джинны услышали Коран и уверовали. Среди них есть мусульмане и неверующие. Только Аллах знает сокровенное.",
  },
  {
    number: 73,
    arabic: "المزمل",
    transliteration: "Al-Muzzammil",
    nameRu: "Закутавшийся",
    verses: 20,
    place: "Мекка",
    descriptionRu:
      "Повеление Пророку совершать ночной намаз (тахаджуд). Терпение при испытаниях и уповании на Аллаха.",
  },
  {
    number: 74,
    arabic: "المدثر",
    transliteration: "Al-Muddathir",
    nameRu: "Завернувшийся",
    verses: 56,
    place: "Мекка",
    descriptionRu:
      "Первые повеления о проповеди. Описание ада. Неверие упрямца, отвергшего Коран из гордости.",
  },
  {
    number: 75,
    arabic: "القيامة",
    transliteration: "Al-Qiyama",
    nameRu: "Воскресение",
    verses: 40,
    place: "Мекка",
    descriptionRu:
      "Клятва Днём воскресения. Человек сам свидетель против себя. Процесс умирания и сбор к Аллаху.",
  },
  {
    number: 76,
    arabic: "الإنسان",
    transliteration: "Al-Insan",
    nameRu: "Человек",
    verses: 31,
    place: "Медина",
    descriptionRu:
      "Человек сотворён из смешанной капли и испытывается. Описание наград праведников в раю.",
  },
  {
    number: 77,
    arabic: "المرسلات",
    transliteration: "Al-Mursalat",
    nameRu: "Посылаемые",
    verses: 50,
    place: "Мекка",
    descriptionRu:
      "Клятва ветрами и ангелами. Рефрен: 'Горе в тот день тем, кто отрицал!' Описание конца света.",
  },
  {
    number: 78,
    arabic: "النبأ",
    transliteration: "An-Naba",
    nameRu: "Весть",
    verses: 40,
    place: "Мекка",
    descriptionRu:
      "Великая весть — о воскрешении и Судном дне. Знамения Аллаха в природе. День, когда всё откроется.",
  },
  {
    number: 79,
    arabic: "النازعات",
    transliteration: "An-Nazi'at",
    nameRu: "Исторгающие",
    verses: 46,
    place: "Мекка",
    descriptionRu:
      "Клятва ангелами смерти. История Мусы и фараона. Страшный день воскресения для грешников.",
  },
  {
    number: 80,
    arabic: "عبس",
    transliteration: "'Abasa",
    nameRu: "Нахмурился",
    verses: 42,
    place: "Мекка",
    descriptionRu:
      "Пророк нахмурился перед слепым Ибн Умм Мактумом. Урок о равном уважении ко всем людям.",
  },
  {
    number: 81,
    arabic: "التكوير",
    transliteration: "At-Takwir",
    nameRu: "Скручивание",
    verses: 29,
    place: "Мекка",
    descriptionRu:
      "Описание конца света: солнце свернётся, звёзды погаснут, горы сдвинутся. Откровение через Джибриля.",
  },
  {
    number: 82,
    arabic: "الانفطار",
    transliteration: "Al-Infitar",
    nameRu: "Разверзание",
    verses: 19,
    place: "Мекка",
    descriptionRu:
      "Небо разверзнется, звёзды рассыплются. Ангелы записывают дела. Никто не поможет в Судный день.",
  },
  {
    number: 83,
    arabic: "المطففين",
    transliteration: "Al-Mutaffifin",
    nameRu: "Обвешивающие",
    verses: 36,
    place: "Мекка",
    descriptionRu:
      "Проклятие обманщикам в торговле. Книга грешников — Сиджжин. Книга праведников — Иллийюн.",
  },
  {
    number: 84,
    arabic: "الانشقاق",
    transliteration: "Al-Inshiqaq",
    nameRu: "Раскалывание",
    verses: 25,
    place: "Мекка",
    descriptionRu:
      "Небо расколется. Человек получит книгу деяний в правую или левую руку. Постепенный переход из состояния в состояние.",
  },
  {
    number: 85,
    arabic: "البروج",
    transliteration: "Al-Buruj",
    nameRu: "Созвездия",
    verses: 22,
    place: "Мекка",
    descriptionRu:
      "Клятва небом с созвездиями. История людей рва — мучеников за веру. Аллах окружает неверующих.",
  },
  {
    number: 86,
    arabic: "الطارق",
    transliteration: "At-Tariq",
    nameRu: "Ночной путник",
    verses: 17,
    place: "Мекка",
    descriptionRu:
      "Клятва ночным путником — яркой звездой. Человек создан из жидкости. Коран — слово, отделяющее истину от лжи.",
  },
  {
    number: 87,
    arabic: "الأعلى",
    transliteration: "Al-A'la",
    nameRu: "Всевышний",
    verses: 19,
    place: "Мекка",
    descriptionRu:
      "Слава Господу Всевышнему. Аллах создал, устроил, направил. Коран будет сохранён в памяти Пророка.",
  },
  {
    number: 88,
    arabic: "الغاشية",
    transliteration: "Al-Ghashiya",
    nameRu: "Покрывающее",
    verses: 26,
    place: "Мекка",
    descriptionRu:
      "Покрывающий день — День суда. Унижение грешников. Награда праведников. Знамения Аллаха в природе.",
  },
  {
    number: 89,
    arabic: "الفجر",
    transliteration: "Al-Fajr",
    nameRu: "Заря",
    verses: 30,
    place: "Мекка",
    descriptionRu:
      "Клятва зарёй и ночами. Судьба народов Ад, Самуд и фараона. Умиротворённая душа возвращается к Господу.",
  },
  {
    number: 90,
    arabic: "البلد",
    transliteration: "Al-Balad",
    nameRu: "Город",
    verses: 20,
    place: "Мекка",
    descriptionRu:
      "Клятва Меккой. Человек испытывается в трудностях. Крутой подъём — освобождение раба, кормление сирот.",
  },
  {
    number: 91,
    arabic: "الشمس",
    transliteration: "Ash-Shams",
    nameRu: "Солнце",
    verses: 15,
    place: "Мекка",
    descriptionRu:
      "Клятва солнцем, луной, днём и ночью. Душа создана с наклонностью к добру и злу. Народ Самуд погиб за грехи.",
  },
  {
    number: 92,
    arabic: "الليل",
    transliteration: "Al-Layl",
    nameRu: "Ночь",
    verses: 21,
    place: "Мекка",
    descriptionRu:
      "Клятва ночью и днём. Два пути: щедрость и богобоязненность или жадность и отрицание. Аллах поведёт к лёгкому.",
  },
  {
    number: 93,
    arabic: "الضحى",
    transliteration: "Ad-Duha",
    nameRu: "Утро",
    verses: 11,
    place: "Мекка",
    descriptionRu:
      "Утешение Пророка после перерыва откровений. Аллах не оставил его. Напоминание о благах и повеление благодарить.",
  },
  {
    number: 94,
    arabic: "الشرح",
    transliteration: "Ash-Sharh",
    nameRu: "Раскрытие",
    verses: 8,
    place: "Мекка",
    descriptionRu:
      "Аллах раскрыл грудь Пророка. Снял с него бремя. Воистину, за каждой трудностью следует облегчение.",
  },
  {
    number: 95,
    arabic: "التين",
    transliteration: "At-Tin",
    nameRu: "Смоква",
    verses: 8,
    place: "Мекка",
    descriptionRu:
      "Клятва смоквой, оливой, горой Синай и Меккой. Человек создан в лучшем облике. Неверующие — низшие из низших.",
  },
  {
    number: 96,
    arabic: "العلق",
    transliteration: "Al-'Alaq",
    nameRu: "Сгусток крови",
    verses: 19,
    place: "Мекка",
    descriptionRu:
      "Первые аяты Корана: 'Читай!' Человек создан из сгустка крови. Аллах научил письму. Запрет препятствовать молитве.",
  },
  {
    number: 97,
    arabic: "القدر",
    transliteration: "Al-Qadr",
    nameRu: "Предопределение",
    verses: 5,
    place: "Мекка",
    descriptionRu:
      "Коран ниспослан в ночь Предопределения (Лайлятуль-Кадр). Эта ночь лучше тысячи месяцев. Ангелы нисходят с миром.",
  },
  {
    number: 98,
    arabic: "البينة",
    transliteration: "Al-Bayyina",
    nameRu: "Ясное знамение",
    verses: 8,
    place: "Медина",
    descriptionRu:
      "Людям Писания дано ясное знамение — Пророк с Кораном. Лучшие из творений — те, кто верует и творит благо.",
  },
  {
    number: 99,
    arabic: "الزلزلة",
    transliteration: "Az-Zalzala",
    nameRu: "Землетрясение",
    verses: 8,
    place: "Медина",
    descriptionRu:
      "Земля потрясётся в Судный день и поведает о делах людей. Кто сделал добро весом с пылинку — увидит его.",
  },
  {
    number: 100,
    arabic: "العاديات",
    transliteration: "Al-'Adiyat",
    nameRu: "Мчащиеся",
    verses: 11,
    place: "Мекка",
    descriptionRu:
      "Клятва скачущими конями. Человек неблагодарен к своему Господу. Тайны сердец откроются в Судный день.",
  },
  {
    number: 101,
    arabic: "القارعة",
    transliteration: "Al-Qari'a",
    nameRu: "Сотрясающая",
    verses: 11,
    place: "Мекка",
    descriptionRu:
      "Великая Сотрясающая — День суда. Люди как разлетевшиеся мотыльки. Весы дел: тяжёлые или лёгкие.",
  },
  {
    number: 102,
    arabic: "التكاثر",
    transliteration: "At-Takathur",
    nameRu: "Страсть к умножению",
    verses: 8,
    place: "Мекка",
    descriptionRu:
      "Соперничество в накоплении богатства отвлекает от главного. Вы увидите ад своими глазами в тот день.",
  },
  {
    number: 103,
    arabic: "العصر",
    transliteration: "Al-'Asr",
    nameRu: "Время",
    verses: 3,
    place: "Мекка",
    descriptionRu:
      "Клятва временем. Все люди в убытке, кроме тех, кто верует, творит благо, наставляет на истину и терпение.",
  },
  {
    number: 104,
    arabic: "الهمزة",
    transliteration: "Al-Humaza",
    nameRu: "Хулитель",
    verses: 9,
    place: "Мекка",
    descriptionRu:
      "Горе злословящему хулителю, накапливающему богатство. Его бросят в сокрушающий огонь.",
  },
  {
    number: 105,
    arabic: "الفيل",
    transliteration: "Al-Fil",
    nameRu: "Слон",
    verses: 5,
    place: "Мекка",
    descriptionRu:
      "История войска Абрахи со слоном, пришедшего разрушить Каабу. Аллах уничтожил их птицами с камнями.",
  },
  {
    number: 106,
    arabic: "قريش",
    transliteration: "Quraysh",
    nameRu: "Курайшиты",
    verses: 4,
    place: "Мекка",
    descriptionRu:
      "Призыв курайшитов к поклонению Господу этого дома, который кормит их в голод и обеспечивает безопасность.",
  },
  {
    number: 107,
    arabic: "الماعون",
    transliteration: "Al-Ma'un",
    nameRu: "Подаяние",
    verses: 7,
    place: "Мекка",
    descriptionRu:
      "Отрицающий религию — тот, кто гонит сироту и не заботится о бедных. Горе небрегущим своей молитвой.",
  },
  {
    number: 108,
    arabic: "الكوثر",
    transliteration: "Al-Kawthar",
    nameRu: "Изобилие",
    verses: 3,
    place: "Мекка",
    descriptionRu:
      "Аллах даровал Пророку Каусар — реку в раю. Совершай молитву и закалывай жертву. Враг твой — бездетный.",
  },
  {
    number: 109,
    arabic: "الكافرون",
    transliteration: "Al-Kafirun",
    nameRu: "Неверующие",
    verses: 6,
    place: "Мекка",
    descriptionRu:
      "Полное разграничение: мусульманин не поклоняется тому, чему поклоняются неверующие. 'Вам — ваша вера, мне — моя'.",
  },
  {
    number: 110,
    arabic: "النصر",
    transliteration: "An-Nasr",
    nameRu: "Помощь",
    verses: 3,
    place: "Медина",
    descriptionRu:
      "Когда придёт помощь Аллаха и победа, люди войдут в ислам толпами. Прославляй Господа и проси прощения.",
  },
  {
    number: 111,
    arabic: "المسد",
    transliteration: "Al-Masad",
    nameRu: "Пальмовые волокна",
    verses: 5,
    place: "Мекка",
    descriptionRu:
      "Проклятие Абу Лахабу — дяде Пророка, злейшему его врагу. Его и его жену ждёт пламенный огонь.",
  },
  {
    number: 112,
    arabic: "الإخلاص",
    transliteration: "Al-Ikhlas",
    nameRu: "Искренность",
    verses: 4,
    place: "Мекка",
    descriptionRu:
      "Аллах Един, Вечный. Не родил и не был рождён. Нет Ему равного. Равна трети Корана по награде.",
  },
  {
    number: 113,
    arabic: "الفلق",
    transliteration: "Al-Falaq",
    nameRu: "Рассвет",
    verses: 5,
    place: "Мекка",
    descriptionRu:
      "Прибежище у Господа рассвета от зла творений, от зла колдовства и завистника. Одна из двух защитных сур.",
  },
  {
    number: 114,
    arabic: "الناس",
    transliteration: "An-Nas",
    nameRu: "Люди",
    verses: 6,
    place: "Мекка",
    descriptionRu:
      "Прибежище у Господа, Царя и Бога людей от зла шайтана, нашёптывающего в сердца. Последняя сура Корана.",
  },
];
