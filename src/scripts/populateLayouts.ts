// // src/scripts/populateSuburbsAndLayouts.ts

// import { sequelize, Layout, Audit } from '../models'
// import { EntityType } from '../models/enums'

// /**
//  * This script will:
//  *  1) Connect to DB
//  *  2) Create/find Suburbs
//  *  3) Create/find Layouts linked to each Suburb
//  *  4) Log audit records for each creation event
//  *  5) Close DB connection
//  *
//  * Usage:
//  *    npx ts-node src/scripts/populateSuburbsAndLayouts.ts
//  */

// async function main() {
//   try {
//     // 1) Connect
//     await sequelize.authenticate()
//     console.log('DB connection established.')

//     // 2) Sample data

//     const data = [
//       {
//         suburbName: 'Eastern Suburbs',
//         layouts: [
//           'Pant Nagar, Ghatkopar',
//           'Chittaranjan Nagar, Ghatkopar',
//           'Ramabai Nagar, Ghatkopar',
//           'Asalfa Village, Ghatkopar',
//           'Chandivali, Powai',
//           'Kopri, Powai',
//           'Tungva, Powai',
//           'Tagore Nagar, Vikhroli',
//           'Kannamvar Nagar, Vikhroli',
//           'Nahur, Mulund',
//           'Rajya & Rashtra Sarathi CHS, Arunoday Nagar, Mulund',
//           'Navghar Road, Mulund',
//           'Mithagar Road, Mulund',
//           'PMGP, Mulund',
//           'World Bank Project, Mulund',
//           'PMGP, Mankhurd',
//           'Gavan Pada, Mulund',
//           'Teachers Colony, Kurla',
//           'Netaji Nagar, Kurla (W)',
//           'Vinoba Bhave Nagar (Transit Camp)',
//           'Vinoba Bhave Nagar, Kurla (W)',
//           'Nehru Nagar, Kurla',
//           'Chunabhatti, Kurla',
//           'Swadeshi Mill Compound, Kurla',
//           'Tilak Nagar, Chembur',
//           'New Tilak Nagar, Chembur',
//           'Sahakar Nagar, Chembur',
//           'Sahakar Nagar (Transit), Chembur',
//           'Subhash Nagar, Chembur',
//           'Turbhe Mandale',
//           'Deonar Govandi',
//         ],
//       },
//       {
//         suburbName: 'Western Suburb & City',
//         layouts: [
//           'Abhyuday Nagar, Kalachowki',
//           'Ambedkar Nagar, Worli',
//           'Shivaji Nagar, Worli',
//           'Aadarsh Nagar, Worli',
//           'Machimar Colony, Mahim',
//           'Lokmanya Nagar, Dadar',
//           'Sardar Nagar - 1,2,3, Sion Koliwada',
//           'Sardar Nagar - 4, Sion Koliwada',
//           'Pratiksha Nagar, Sion',
//           'Scheme No.57, Dnyaneshwar Nagar, Sewri - Wadala',
//           'Antop Hill, Wadala',
//           'Garam Khada, Lalbaug',
//           'Navyojan Sadan, Tardeo',
//           'Cuffe Parade, Colaba',
//           'Shivkrupa, Prabhadevi',
//           'Jijamata Nagar',
//           'Patrachawl, Goregaon',
//           'Motilal Nagar, Part - 1, Goregaon (W)',
//           'Motilal Nagar, Part - II & III, Goregaon (W)',
//           'Siddharth Nagar, Goregaon (W)',
//           'Unnat Nagar, Goregaon (W)',
//           'Shastri Nagar, Goregaon (W)',
//           'Mitha Nagar, Goregaon (W)',
//           'Saneguruji Nagar, Goregaon (W)',
//           'Yashwant Nagar, Goregaon (W)',
//           'New Subhash Nagar, Goregaon (W)',
//           'Arey Colony, Goregaon (E)',
//           'Bimbisar Nagar, Goregaon (E)',
//           'Site & Services (Dindoshi), Malad',
//           'Dindoshi, Malad (E)',
//           'Khadakpada, Malad',
//           'Dindoshi, Malad (E) (New)',
//           'Dadasaheb Gaikwad Nagar, Malvani, Malad (W)',
//           'World Bank Project, Malvani, Malad (W)',
//           'Ekata Nagar, Malad (W)',
//           'Janakalyan Nagar',
//           'Samta Nagar, Kandivali',
//           'Mahaveer Nagar, Kandivali',
//           'Gorai Road, World Bank Project - Part 1',
//           'Gorai Road, World Bank Project - Part 2',
//           'Gorai Road, World Bank Project - Part 3',
//           'Gorai Road',
//           'Charkop, World Bank Project',
//           'Charkop, World Bank Project Sec.7',
//           'World Bank Project (Sec.8 & 9), Charkop',
//           'World Bank Project, Akurli, Kandivali (E)',
//           'World Bank Project, Kandivali',
//           'Poisar, Kandivali',
//           'Old MHB Colony, Gorai',
//           'New MHB Colony, Gorai Road (Ashtavinayak Nagar)',
//           'Magathane (Old), Borivali',
//           'Magathane (New), Borivali',
//           'Eksar, Borivali',
//           'Ashokvan, Borivali',
//           'Rajendra Nagar, Borivali (E)',
//           'Shailendra Nagar, Dahisar',
//           'Chunnabhatti, Dahisar',
//           'Bandra Reclamation, Bandra (W)',
//           'Anant Kanekar Marg, Bandra (W)',
//           'S.No. 7 & 8, Bandra (W)',
//           'Teachers Colony, Bandra (E)',
//           'Bharat Nagar, Bandra (E)',
//           'Gandhi Nagar, Bandra (E)',
//           'Kher Nagar, Bandra (E)',
//           'Vijay Nagar, Bandra (E)',
//           'Nirmal Nagar, Khar (E)',
//           'Ramkrishna Nagar, Khar (E)',
//           'Anand Nagar, Santacruz A & B',
//           'Kole-Kalyan, Santacruz (E)',
//           'Sundar Nagar (Kolekalyan), Kalina, Santacruz (E)',
//           'Chakkikhana, Santacruz (E)',
//           'Chaitanya Nagar, Santacruz Vakola',
//           'J.V.P.D., Vile-Parle',
//           'D.N.Nagar, Andheri',
//           'Azad Nagar, Andheri',
//           'Aram Nagar, Versova',
//           'S.V.P. Nagar, Versova',
//           'Versova (MHB), Andheri (W)',
//           'Nityanand Nagar-I & II, III, IV, Andheri',
//           'Sarvodaya Nagar, Majaswadi, Jogeshwari',
//           'P.M.G.P. and Mass Housing, Majaswadi, Jogeshwari',
//           'Oshiwara, Jogeshwari',
//           'Patliputra Nagar, Oshiwara Transit Camp',
//         ],
//       },
//     ]

//     // 3) Create/find suburbs and layouts
//     for (const entry of data) {
//       for (const layoutName of entry.layouts) {
//         let layout = await Layout.findOne({
//           where: { name: layoutName },
//         })
//         if (!layout) {
//           layout = await Layout.create({
//             suburbName: entry.suburbName,
//             name: layoutName,
//           })
//           console.log(`\tCreated Layout => ${layout.name}`)

//           // Log audit for layout creation
//           await Audit.create({
//             entity: EntityType.LAYOUT,
//             entityId: layout.id,
//             action: 'Create',
//             performedBy: '00000000-0000-0000-0000-000000000000',
//             remarks: `Layout "${layout.name}" created via seed script.`,
//             ipAddress: '127.0.0.1',
//             timestamp: new Date(),
//           })
//         } else {
//           console.log(`\tLayout already exists => ${layout.name}`)
//         }
//       }
//     }

//     console.log('All suburbs and layouts processed successfully!')
//   } catch (error) {
//     console.error('ERROR in populateSuburbsAndLayouts.ts =>', error)
//   } finally {
//     // 4) Close DB connection
//     await sequelize.close()
//     process.exit(0)
//   }
// }

// main().catch((err) => {
//   console.error(err)
//   process.exit(1)
// })
