import { Request, Response } from 'express';
import {
    Op,
    Sequelize,
    Model,
} from 'sequelize';

import { Avak } from '../models/avak.model';
import { Javak } from '../models/javak.model';
import { Section } from '../models/section.model';
import { Sender } from '../models/sender.model';
import { Branch } from '../models/branch.model';
import { AuthRequest } from '../types/auth.types';

// -----------------------------------------
// AVAK INCLUDE
// -----------------------------------------

const avakIncludes = [
    {
        model: Sender,
        as: 'sender',
        required: false,
    },
    {
        model: Branch,
        as: 'branch',
        required: false,
    },
    {
        model: Section,
        as: 'markedSection',
        required: false,
    },
];

// -----------------------------------------
// JAVAK INCLUDE
// -----------------------------------------

const javakIncludes = [
    {
        model: Avak,
        as: 'avak',
        required: true,
        include: avakIncludes,
    },
];

// -----------------------------------------
// HELPER: GROUPED COUNTS
// -----------------------------------------

// const getGroupedCounts = async (
//     model: any,
//     field: string,
//     where: any = {},
//     include: any[] = []
// ) => {
//     const results = await model.findAll({
//         attributes: [
//             field,
//             [
//                 Sequelize.fn('COUNT', Sequelize.col('id')),
//                 'count',
//             ],
//         ],
//         where,
//         include,
//         group: [field],
//         raw: true,
//     });

//     return results.map((item: any) => ({
//         value: item[field] ?? 'Not Set',
//         count: Number(item.count),
//     }));
// };
const getGroupedCounts = async (
    model: any,
    field: string,
    where: any = {},
    include: any[] = []
) => {
    // Get actual database column name
    const dbField =
        model.rawAttributes[field]?.field || field;

    const tableAlias = model.name;

    const qualifiedField = Sequelize.col(
        `${tableAlias}.${dbField}`
    );

    const qualifiedId = Sequelize.col(
        `${tableAlias}.id`
    );

    const results = await model.findAll({
        attributes: [
            [qualifiedField, 'value'],
            [
                Sequelize.fn('COUNT', qualifiedId),
                'count',
            ],
        ],
        where,
        include,
        group: [qualifiedField],
        raw: true,
    });

    return results.map((item: any) => ({
        value: item.value ?? 'Not Set',
        count: Number(item.count),
    }));
};

// -----------------------------------------
// HELPER: SECTION-WISE AVAK COUNTS
// -----------------------------------------

const getAvakSectionWiseCounts = async (
    avakWhere: any
) => {
    const results = await Avak.findAll({
        attributes: ['markedSectionId'],
        where: avakWhere,
        raw: true,
    });

    const counts = new Map<string, number>();

    for (const item of results as any[]) {
        const sectionId = item.markedSectionId ?? 'NOT_SET';

        counts.set(
            sectionId,
            (counts.get(sectionId) || 0) + 1
        );
    }

    return getSectionDetails(counts);
};

// -----------------------------------------
// HELPER: JAVAK DOCUMENT RECEIVED SECTION-WISE
// -----------------------------------------

const getJavakSectionWiseCounts = async (
    avakWhere: any
) => {
    const results = await Javak.findAll({
        attributes: [
            'isDocumentReceived',
        ],
        include: [
            {
                model: Avak,
                as: 'avak',
                attributes: ['markedSectionId'],
                required: true,
                where: avakWhere,
            },
        ],
        raw: true,
    });

    const counts = new Map<string, {
        received: number;
        notReceived: number;
    }>();

    for (const item of results as any[]) {
        const sectionId =
            item['avak.markedSectionId'] ?? 'NOT_SET';

        if (!counts.has(sectionId)) {
            counts.set(sectionId, {
                received: 0,
                notReceived: 0,
            });
        }

        const current = counts.get(sectionId)!;

        if (item.isDocumentReceived === true) {
            current.received++;
        } else {
            current.notReceived++;
        }
    }

    const sectionIds = [...counts.keys()].filter(
        id => id !== 'NOT_SET'
    );

    const sections = sectionIds.length
        ? await Section.findAll({
            where: {
                id: {
                    [Op.in]: sectionIds,
                },
            },
            attributes: ['id', 'sectionName', 'sectionCode'],
            raw: true,
        })
        : [];

    const sectionMap = new Map(
        (sections as any[]).map(section => [
            section.id,
            section,
        ])
    );

    return Array.from(counts.entries()).map(
        ([sectionId, count]) => ({
            sectionId: sectionId === 'NOT_SET'
                ? null
                : sectionId,

            sectionName: sectionId === 'NOT_SET'
                ? 'Not Set'
                : sectionMap.get(sectionId)?.sectionName
                    ?? 'Unknown Section',

            sectionCode: sectionId === 'NOT_SET'
                ? null
                : sectionMap.get(sectionId)?.sectionCode ?? null,

            total: count.received + count.notReceived,
            documentsReceived: count.received,
            documentsNotReceived: count.notReceived,
        })
    );
};

// -----------------------------------------
// HELPER: GET SECTION DETAILS
// -----------------------------------------

const getSectionDetails = async (
    counts: Map<string, number>
) => {
    const sectionIds = [...counts.keys()].filter(
        id => id !== 'NOT_SET'
    );

    const sections = sectionIds.length
        ? await Section.findAll({
            where: {
                id: {
                    [Op.in]: sectionIds,
                },
            },
            attributes: [
                'id',
                'sectionName',
                'sectionCode',
            ],
            raw: true,
        })
        : [];

    const sectionMap = new Map(
        (sections as any[]).map(section => [
            section.id,
            section,
        ])
    );

    return Array.from(counts.entries()).map(
        ([sectionId, count]) => ({
            sectionId: sectionId === 'NOT_SET'
                ? null
                : sectionId,

            sectionName: sectionId === 'NOT_SET'
                ? 'Not Set'
                : sectionMap.get(sectionId)?.sectionName
                    ?? 'Unknown Section',

            sectionCode: sectionId === 'NOT_SET'
                ? null
                : sectionMap.get(sectionId)?.sectionCode ?? null,

            count,
        })
    );
};

// -----------------------------------------
// DASHBOARD API
// -----------------------------------------

export const getDashboard = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const {
            fromDate,
            toDate,
            sectionId,
        } = req.body;

        const page = Math.max(
            1,
            Number(req.body.page) || 1
        );

        const limit = Math.min(
            100,
            Math.max(1, Number(req.body.limit) || 5)
        );

        const offset = (page - 1) * limit;

        // ---------------------------------
        // VALIDATE DATE FILTERS
        // ---------------------------------

        const isValidDate = (date: any) =>
            typeof date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(date) &&
            !Number.isNaN(Date.parse(date)) &&
            new Date(date).toISOString().slice(0, 10) === date;

        if (fromDate && !isValidDate(fromDate)) {
            return res.status(400).json({
                message: 'Invalid fromDate. Use YYYY-MM-DD format.',
            });
        }

        if (toDate && !isValidDate(toDate)) {
            return res.status(400).json({
                message: 'Invalid toDate. Use YYYY-MM-DD format.',
            });
        }

        if (fromDate && toDate && fromDate > toDate) {
            return res.status(400).json({
                message: 'fromDate cannot be greater than toDate.',
            });
        }

        // ---------------------------------
        // BUILD AVAK FILTER
        // ---------------------------------

        const avakWhere: any = {};

        if (fromDate || toDate) {
            avakWhere.registrationDate = {};

            if (fromDate) {
                avakWhere.registrationDate[Op.gte] = fromDate;
            }

            if (toDate) {
                avakWhere.registrationDate[Op.lte] = toDate;
            }
        }

        if (sectionId) {
            avakWhere.markedSectionId = sectionId;
        }

        // JAVAK records are filtered through associated AVAK.
        const javakIncludeForStats = [
            {
                model: Avak,
                as: 'avak',
                attributes: [],
                required: true,
                where: avakWhere,
            },
        ];

        // ---------------------------------
        // 1. SUMMARY COUNTS
        // ---------------------------------

        const [
            totalAvaks,
            totalJavaks,
            documentsReceived,
            documentsNotReceived,
        ] = await Promise.all([
            Avak.count({
                where: avakWhere,
            }),

            Javak.count({
                include: javakIncludeForStats,
                distinct: true,
            }),

            Javak.count({
                where: {
                    isDocumentReceived: true,
                },
                include: javakIncludeForStats,
                distinct: true,
            }),

            Javak.count({
                where: {
                    isDocumentReceived: false,
                },
                include: javakIncludeForStats,
                distinct: true,
            }),
        ]);

        // ---------------------------------
        // 2. AVAK STATISTICS
        // ---------------------------------

        const [
            categoryWise,
            priorityWise,
            confidentialityWise,
            avakStatusWise,
            inspectionWise,
            sectionWise,
        ] = await Promise.all([
            getGroupedCounts(
                Avak,
                'correspondenceType',
                avakWhere
            ),

            getGroupedCounts(
                Avak,
                'priority',
                avakWhere
            ),

            getGroupedCounts(
                Avak,
                'confidentiality',
                avakWhere
            ),

            getGroupedCounts(
                Avak,
                'status',
                avakWhere
            ),

            getGroupedCounts(
                Avak,
                'isInspection',
                avakWhere
            ),

            getAvakSectionWiseCounts(avakWhere),
        ]);

        // Ensure both inspection values are present.
        const inspectionMap = new Map(
            inspectionWise.map((item: any) => [
                String(item.value),
                item.count,
            ])
        );

        const inspectionWiseFinal = [
            {
                value: true,
                count: Number(inspectionMap.get('true') || 0),
            },
            {
                value: false,
                count: Number(inspectionMap.get('false') || 0),
            },
        ];

        // ---------------------------------
        // 3. JAVAK STATISTICS
        // ---------------------------------

        const [
            javakStatusWise,
            dispatchModeWise,
            documentReceivedWise,
            sectionWiseDocumentReceived,
        ] = await Promise.all([
            getGroupedCounts(
                Javak,
                'status',
                {},
                javakIncludeForStats
            ),

            getGroupedCounts(
                Javak,
                'dispatchMode',
                {},
                javakIncludeForStats
            ),

            getGroupedCounts(
                Javak,
                'isDocumentReceived',
                {},
                javakIncludeForStats
            ),

            getJavakSectionWiseCounts(avakWhere),
        ]);

        // Ensure both document receipt values are present.
        const receivedMap = new Map(
            documentReceivedWise.map((item: any) => [
                String(item.value),
                item.count,
            ])
        );

        const documentReceivedWiseFinal = [
            {
                value: true,
                count: Number(receivedMap.get('true') || 0),
            },
            {
                value: false,
                count: Number(receivedMap.get('false') || 0),
            },
        ];

        // ---------------------------------
        // 4. AVAK LIST
        // ---------------------------------

        const {
            count: avakTotal,
            rows: avaks,
        } = await Avak.findAndCountAll({
            where: avakWhere,
            include: avakIncludes,
            order: [
                ['registrationDate', 'DESC'],
                ['createdAt', 'DESC'],
            ],
            limit,
            offset,
            distinct: true,
        });

        // ---------------------------------
        // 5. JAVAK LIST
        // ---------------------------------

        const {
            count: javakTotal,
            rows: javaks,
        } = await Javak.findAndCountAll({
            include: javakIncludes.map(item => ({
                ...item,
                required: true,
                where: avakWhere,
            })),
            order: [
                ['createdAt', 'DESC'],
            ],
            limit,
            offset,
            distinct: true,
        });

        // ---------------------------------
        // FINAL RESPONSE
        // ---------------------------------

        return res.status(200).json({
            message: 'Dashboard statistics fetched successfully.',

            data: {
                filters: {
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                    sectionId: sectionId || null,
                },

                summary: {
                    totalAvaks,
                    totalJavaks,
                    documentsReceived,
                    documentsNotReceived,
                },

                avakStatistics: {
                    categoryWise,
                    priorityWise,
                    confidentialityWise,
                    statusWise: avakStatusWise,
                    inspectionWise: inspectionWiseFinal,
                    sectionWise,
                },

                javakStatistics: {
                    statusWise: javakStatusWise,
                    dispatchModeWise,
                    documentReceivedWise: documentReceivedWiseFinal,
                    sectionWiseDocumentReceived,
                },

                lists: {
                    avaks: {
                        total: avakTotal,
                        page,
                        limit,
                        totalPages: Math.ceil(avakTotal / limit),
                        records: avaks,
                    },

                    javaks: {
                        total: javakTotal,
                        page,
                        limit,
                        totalPages: Math.ceil(javakTotal / limit),
                        records: javaks,
                    },
                },
            },
        });

    } catch (error: any) {
        console.error('getDashboard error:', error);

        return res.status(500).json({
            message: 'Failed to fetch dashboard statistics.',
            error: error.message,
        });
    }
};



export const getAvakJavakStatusCounts = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { month, year } = req.body;

        // ---------------------------------
        // VALIDATE AND NORMALIZE MONTHS
        // ---------------------------------

        let selectedMonths: number[] = [];

        if (month !== undefined && month !== null) {
            const months = Array.isArray(month) ? month : [month];

            if (
                months.length === 0 ||
                months.some(
                    (m: any) =>
                        !Number.isInteger(Number(m)) ||
                        Number(m) < 1 ||
                        Number(m) > 12
                )
            ) {
                return res.status(400).json({
                    message: 'Invalid month. Months must be between 1 and 12.'
                });
            }

            selectedMonths = [...new Set(months.map(Number))].sort(
                (a, b) => a - b
            );
        } else {
            // All 12 months
            selectedMonths = Array.from(
                { length: 12 },
                (_, index) => index + 1
            );
        }

        // ---------------------------------
        // VALIDATE AND NORMALIZE YEARS
        // ---------------------------------

        let selectedYears: number[] = [];

        if (year !== undefined && year !== null) {
            const years = Array.isArray(year) ? year : [year];

            if (
                years.length === 0 ||
                years.some(
                    (y: any) =>
                        !Number.isInteger(Number(y)) ||
                        Number(y) < 2000 ||
                        Number(y) > 2100
                )
            ) {
                return res.status(400).json({
                    message: 'Invalid year. Please provide a valid year.'
                });
            }

            selectedYears = [...new Set(years.map(Number))].sort(
                (a, b) => a - b
            );
        } else {
            // Default current year
            selectedYears = [new Date().getFullYear()];
        }

        // ---------------------------------
        // FETCH MONTH-WISE COUNTS
        // ---------------------------------

        const data: Record<string, any> = {};

        for (const selectedYear of selectedYears) {

            data[selectedYear] = {};

            const monthlyResults = await Promise.all(
                selectedMonths.map(async (selectedMonth) => {

                    const startDate = new Date(
                        selectedYear,
                        selectedMonth - 1,
                        1
                    );

                    const endDate = new Date(
                        selectedYear,
                        selectedMonth,
                        1
                    );

                    // AVAK DATE FILTER
                    const avakWhere: any = {
                        registrationDate: {
                            [Op.gte]: startDate,
                            [Op.lt]: endDate
                        }
                    };

                    // JAVAK FILTER THROUGH ASSOCIATED AVAK
                    const javakInclude = [
                        {
                            model: Avak,
                            as: 'avak',
                            attributes: [],
                            required: true,
                            where: avakWhere
                        }
                    ];

                    // ---------------------------------
                    // FETCH MONTHLY COUNTS
                    // ---------------------------------

                    const [
                        totalAvak,
                        totalJavak,
                        avakStatusWise,
                        javakStatusWise
                    ] = await Promise.all([

                        // Total Avak
                        Avak.count({
                            where: avakWhere
                        }),

                        // Actual Total Javak
                        Javak.count({
                            include: javakInclude,
                            distinct: true,
                            col: 'id'
                        }),

                        // Avak Status Wise
                        Avak.findAll({
                            attributes: [
                                'status',
                                [
                                    Sequelize.fn(
                                        'COUNT',
                                        Sequelize.col('Avak.id')
                                    ),
                                    'count'
                                ]
                            ],
                            where: avakWhere,
                            group: ['Avak.status'],
                            order: [
                                [Sequelize.col('Avak.status'), 'ASC']
                            ],
                            raw: true
                        }),

                        // Javak Status Wise
                        Javak.findAll({
                            attributes: [
                                'status',
                                [
                                    Sequelize.fn(
                                        'COUNT',
                                        Sequelize.col('Javak.id')
                                    ),
                                    'count'
                                ]
                            ],
                            include: javakInclude,
                            group: ['Javak.status'],
                            order: [
                                [Sequelize.col('Javak.status'), 'ASC']
                            ],
                            raw: true
                        })
                    ]);

                    // ---------------------------------
                    // FORMAT STATUS COUNTS
                    // ---------------------------------

                    const formattedAvakStatusWise =
                        (avakStatusWise as any[]).map(item => ({
                            status: item.status ?? 'Not Set',
                            count: Number(item.count)
                        }));

                    const formattedJavakStatusWise =
                        (javakStatusWise as any[]).map(item => ({
                            status: item.status ?? 'Not Set',
                            count: Number(item.count)
                        }));

                    return {
                        month: selectedMonth,
                        result: {
                            totalAvak: Number(totalAvak),
                            totalJavak: Number(totalJavak),
                            avakStatusWise: formattedAvakStatusWise,
                            javakStatusWise: formattedJavakStatusWise
                        }
                    };
                })
            );

            // ---------------------------------
            // STORE MONTH-WISE RESULTS
            // ---------------------------------

            monthlyResults.forEach(({ month, result }) => {
                data[selectedYear][month] = result;
            });
        }

        // ---------------------------------
        // FINAL RESPONSE
        // ---------------------------------

        return res.status(200).json({
            message: 'Avak and Javak status counts fetched successfully.',

            filters: {
                month: month ?? null,
                year: year ?? null
            },

            data
        });

    } catch (error: any) {
        console.error(
            'getAvakJavakStatusCounts error:',
            error
        );

        return res.status(500).json({
            message: 'Failed to fetch Avak and Javak status counts.',
            error: error.message
        });
    }
};
