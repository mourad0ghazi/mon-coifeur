-- HLAQTI — Référentiels de lancement Casablanca / Sidi Bernoussi
INSERT INTO neighborhoods(city,name,center,active) VALUES
 ('Casablanca','{"fr":"Sidi Bernoussi","ar":"سيدي البرنوصي","ary":"Sidi Bernoussi"}',ST_SetSRID(ST_MakePoint(-7.5000,33.6167),4326)::geography,true),
 ('Casablanca','{"fr":"Sidi Moumen","ar":"سيدي مومن","ary":"Sidi Moumen"}',ST_SetSRID(ST_MakePoint(-7.5167,33.5833),4326)::geography,true),
 ('Casablanca','{"fr":"Aïn Sebaâ","ar":"عين السبع","ary":"Aïn Sebaâ"}',ST_SetSRID(ST_MakePoint(-7.5330,33.6050),4326)::geography,true),
 ('Casablanca','{"fr":"Hay Mohammadi","ar":"الحي المحمدي","ary":"Hay Mohammadi"}',ST_SetSRID(ST_MakePoint(-7.5600,33.5900),4326)::geography,true),
 ('Casablanca','{"fr":"Zenata","ar":"زناتة","ary":"Zenata"}',ST_SetSRID(ST_MakePoint(-7.4500,33.6400),4326)::geography,true),
 ('Casablanca','{"fr":"Ahl Loghlam","ar":"أهل الغلام","ary":"Ahl Loghlam"}',ST_SetSRID(ST_MakePoint(-7.4700,33.6000),4326)::geography,true)
ON CONFLICT(city,name) DO NOTHING;

INSERT INTO categories(name,icon,display_order,gender) VALUES
 ('{"fr":"Cheveux homme","ar":"شعر الرجال","ary":"Cheveux rjal"}','scissors',1,'HOMME'),
 ('{"fr":"Barbe","ar":"اللحية","ary":"Lehya"}','razor',2,'HOMME'),
 ('{"fr":"Enfant","ar":"أطفال","ary":"Drari"}','baby',3,'ENFANT'),
 ('{"fr":"Femme","ar":"نساء","ary":"3yalat"}','sparkles',4,'FEMME'),
 ('{"fr":"Formules","ar":"باقات","ary":"Packs"}','layers',5,'MIXTE'),
 ('{"fr":"Soins","ar":"العناية","ary":"Soins"}','droplet',6,'MIXTE');

INSERT INTO specialties(slug,name,gender) VALUES
 ('degrade-americain','{"fr":"Dégradé américain","ar":"تدرج أمريكي"}','HOMME'),
 ('taper-fade','{"fr":"Taper fade","ar":"تايبر فايد"}','HOMME'),
 ('buzz-cut','{"fr":"Buzz cut"}','HOMME'),
 ('ciseaux','{"fr":"Ciseaux uniquement","ar":"مقص فقط"}','HOMME'),
 ('barbe-rasoir','{"fr":"Barbe au rasoir","ar":"لحية بالموس"}','HOMME'),
 ('contour-barbe','{"fr":"Contour de barbe"}','HOMME'),
 ('coloration-homme','{"fr":"Coloration homme"}','HOMME'),
 ('coupe-enfant','{"fr":"Coupe enfant","ar":"حلاقة الأطفال"}','ENFANT'),
 ('coupe-femme','{"fr":"Coupe femme","ar":"قص شعر نسائي"}','FEMME'),
 ('brushing','{"fr":"Brushing"}','FEMME'),
 ('lissage','{"fr":"Lissage"}','FEMME'),
 ('soin-capillaire','{"fr":"Soin capillaire"}','MIXTE')
ON CONFLICT(slug) DO NOTHING;

INSERT INTO plans(name,price_mad,limits) VALUES
 ('Gratuit',0,'{"maxBarbers":1,"maxBookings":40,"maxPhotos":10,"queue":false,"stats":"basic"}'),
 ('Pro',149,'{"maxBarbers":3,"maxBookings":null,"maxPhotos":60,"queue":true,"stats":"full","whatsapp":100}'),
 ('Salon',299,'{"maxBarbers":null,"maxBookings":null,"maxPhotos":null,"queue":true,"stats":"full","whatsapp":500}')
ON CONFLICT(name) DO NOTHING;

INSERT INTO holidays(day,name,country) VALUES
 ('2026-01-01','{"fr":"Nouvel An","ar":"رأس السنة"}','MA'),
 ('2026-01-11','{"fr":"Manifeste de l’indépendance","ar":"ذكرى تقديم وثيقة الاستقلال"}','MA'),
 ('2026-05-01','{"fr":"Fête du Travail","ar":"عيد الشغل"}','MA'),
 ('2026-07-30','{"fr":"Fête du Trône","ar":"عيد العرش"}','MA'),
 ('2026-08-14','{"fr":"Allégeance Oued Eddahab","ar":"استرجاع وادي الذهب"}','MA'),
 ('2026-08-20','{"fr":"Révolution du Roi et du Peuple","ar":"ثورة الملك والشعب"}','MA'),
 ('2026-08-21','{"fr":"Fête de la Jeunesse","ar":"عيد الشباب"}','MA'),
 ('2026-11-06','{"fr":"Marche Verte","ar":"المسيرة الخضراء"}','MA'),
 ('2026-11-18','{"fr":"Fête de l’Indépendance","ar":"عيد الاستقلال"}','MA')
ON CONFLICT(day,country) DO NOTHING;
