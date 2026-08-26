// Catalogue de secours utilisé lorsque la clé Google Maps n'est pas configurée.
// Quand NEXT_PUBLIC_GOOGLE_MAPS_API_KEY est définie, l'autocomplétion Google
// prend le relais et couvre toutes les villes et tous les quartiers du Maroc,
// avec les noms exacts de Google Maps.

export const MOROCCAN_CITIES: string[] = [
  'Casablanca', 'Rabat', 'Salé', 'Marrakech', 'Fès', 'Meknès', 'Tanger', 'Agadir',
  'Oujda', 'Kénitra', 'Tétouan', 'Mohammedia', 'El Jadida', 'Béni Mellal', 'Nador',
  'Khémisset', 'Taza', 'Settat', 'Khouribga', 'Berrechid', 'Larache', 'Ksar El Kébir',
  'Chefchaouen', 'Taourirt', 'Essaouira', 'Ouarzazate', 'Tiznit', 'Taroudant',
  'Ouezzane', 'Sefrou', 'Zagora', 'Azrou', 'Ifrane', 'Kasba Tadla',
  'Fquih Ben Salah', 'Souk El Arbaa', 'Martil', "M'diq", 'Fnideq', 'Asilah',
  'Taounate', 'Guercif', 'Missour', 'Boulemane', 'El Hajeb', 'Khénifra', 'Midelt',
  'Errachidia', 'Tinghir', 'Tata', 'Tan-Tan', 'Tarfaya', 'Laâyoune', 'Boujdour',
  'Dakhla', 'Smara', 'Benslimane', 'Bouznika', 'Aïn Harrouda', 'Médiouna',
  'Tit Mellil', 'Nouaceur', 'Bouskoura', 'Dar Bouazza', 'Sidi Rahal', 'Azemmour',
  'Sidi Bennour', 'Youssoufia', 'Safi', 'Chichaoua', 'Tahannaoutte', 'Amizmiz',
  'Demnate', 'Azilal', 'Oued Zem', 'Ben Ahmed', 'Témara', 'Skhirat', 'Aïn Aouda',
  'Tiflet', 'Rommani', 'Bouknadel', 'Harhoura',
];

// Quartiers issus de la nomenclature Google Maps pour les principales villes.
export const MOROCCAN_NEIGHBORHOODS: { city: string; name: string }[] = [
  // Casablanca
  ...['Sidi Bernoussi', 'Sidi Moumen', 'Aïn Sebaâ', 'Hay Mohammadi', 'Aïn Chock',
    'Maârif', 'Anfa', 'Derb Sultan', 'Bourgogne', 'Gauthier', 'Sidi Maârouf',
    'Oasis', 'Californie', 'Hay Hassani', 'Moulay Rachid', 'Sbata', "Ben M'sick", 'Zenata', 'Ahl Loghlam',
    'Sidi Othmane', 'Mers Sultan', 'Roches Noires', 'Belvédère', 'Hermitage',
    'Al Fida', 'Médina', 'Bouskoura', 'Dar Bouazza', 'Lahraouyine', 'Médiouna',
    'Nouaceur', 'Tit Mellil', 'Aïn Harrouda', 'Ziraoui', 'Palmier', 'CIL',
    'Hay Sadri', 'Al Qods', 'Errahma', 'Oulfa', 'Azli', 'Hay Farah', 'Lissasfa',
    'Casa Anfa', 'Casa Finance City', '2 Mars', 'Drissia', 'Aïn Diab', 'Sidi Abderrahman']
    .map((name) => ({ city: 'Casablanca', name })),
  // Rabat
  ...['Agdal', 'Hay Riad', 'Souissi', 'L’Océan', 'Médina de Rabat', 'Hassan',
    'Yacoub El Mansour', 'Takaddoum', 'Akkari', 'Diour Jamaa', 'Bab Rouah',
    'Les Orangers', 'Cité Universitaire', 'Hay Nahda', 'Aviation']
    .map((name) => ({ city: 'Rabat', name })),
  // Salé
  ...['Tabriquet', 'Bettana', 'Bab Lamrissa', 'Hssaine', 'Layayda', 'Sala El Jadida',
    'Taqaddoum', 'Charf-Mghogha', 'Bouknadel']
    .map((name) => ({ city: 'Salé', name })),
  // Marrakech
  ...['Guéliz', 'Hivernage', 'Médina', 'Kasbah', 'Palmeraie', 'Targa', 'Daoudiate',
    'Amerchich', 'Sidi Youssef Ben Ali', 'Massira', 'Issil', 'Annakhil', 'M’hamid',
    'Quartz', 'Semlalia']
    .map((name) => ({ city: 'Marrakech', name })),
  // Tanger
  ...['Marshan', 'Médina de Tanger', 'Malabata', 'Beni Makada', 'Charf',
    'Ahlan', 'Boukhalef', 'M’sallah', 'Souani', 'Gzenaya', 'Ksar El Majaz']
    .map((name) => ({ city: 'Tanger', name })),
  // Fès
  ...['Fès el-Bali', 'Fès el-Jdid', 'Ville Nouvelle', 'Saïss', 'Atlas',
    'Zouagha', 'Bensouda', 'Aïn Chkef', 'Dhar El Mehraz', 'Bab Ftouh', 'Sidi Brahim']
    .map((name) => ({ city: 'Fès', name })),
  // Agadir
  ...['Secteur Touristique', 'Talborjt', 'Founty', 'Charaf', 'Anza', 'Tikiouine',
    'Dakhla Agadir', 'Hay Mohammadi', 'Amsernat', 'El Houda', 'Aït Melloul', 'Dcheira']
    .map((name) => ({ city: 'Agadir', name })),
  // Meknès
  ...['Hamria', 'Médina de Meknès', 'Al Ismailia', 'Sidi Bouzekri', 'Toulal',
    'Bassatine', 'Plaisance', 'Marjane', 'Zerhounia']
    .map((name) => ({ city: 'Meknès', name })),
  // Oujda
  ...['Centre Ville Oujda', 'Hay El Qods', 'Hay Anassi', 'Sidi Ziane',
    'Lazaret', 'Beni Drar', 'Ahl Oujda', 'El Mokrani']
    .map((name) => ({ city: 'Oujda', name })),
  // Kénitra
  ...['Mehdia', 'Centre Ville Kénitra', 'Bir Rami', 'Saknia', 'Khabazate',
    'Ouled Oujih', 'Souk El Arbaa']
    .map((name) => ({ city: 'Kénitra', name })),
  // Tétouan
  ...['Médina de Tétouan', 'Ensanche', 'Mhaneq', 'Aïn Melloulsi', 'Tetouan Centre',
    'Oued Laou', 'Martil', 'Fnideq', "M'diq"]
    .map((name) => ({ city: 'Tétouan', name })),
];
