/**
 * 🗓️ 주간 스마트 스케줄러
 * ========================
 * - 날씨(온도, 습도, 강우) 기반 작업 자동 배치
 * - 작년 동일 주차 시간별 기후 데이터 활용
 * - 일출~일몰 시간 내 작업 스케줄링
 * - 외부 일정 관리
 * - 작업 불가일: 일요일, 수요일
 */

const WeeklyScheduler = (function() {
  
  // =============================================
  // 상수 정의
  // =============================================
  
  const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
  const DAYS_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  
  // =============================================
  // 주차별 시간대별 평균 기후 데이터 (한국 포도 주산지 기준)
  // 기상청 최근 5년 평년값 기반 (2020-2024), 시간대별 보정
  // 최근 기후변화(온난화) 반영
  // =============================================
  
  const HISTORICAL_HOURLY_CLIMATE = {
    // 1주차 (1/19~1/25) - 열가둠 시작 [5년 평년값: 30년 대비 +1.5°C]
    1: {
      hourly: [
        { hour: 6, temp: -2, humidity: 82 },
        { hour: 7, temp: -1, humidity: 80 },
        { hour: 8, temp: 0, humidity: 77 },
        { hour: 9, temp: 2, humidity: 72 },
        { hour: 10, temp: 4, humidity: 67 },
        { hour: 11, temp: 5, humidity: 62 },
        { hour: 12, temp: 6, humidity: 57 },
        { hour: 13, temp: 6, humidity: 55 },
        { hour: 14, temp: 6, humidity: 57 },
        { hour: 15, temp: 5, humidity: 62 },
        { hour: 16, temp: 4, humidity: 67 },
        { hour: 17, temp: 2, humidity: 72 },
        { hour: 18, temp: 1, humidity: 77 }
      ],
      rainChance: 18, avgTemp: 2, minTemp: -2, maxTemp: 6
    },
    // 2주차 (1/26~2/1) [5년 평년값]
    2: {
      hourly: [
        { hour: 6, temp: -1, humidity: 80 },
        { hour: 7, temp: 0, humidity: 77 },
        { hour: 8, temp: 1, humidity: 74 },
        { hour: 9, temp: 3, humidity: 69 },
        { hour: 10, temp: 5, humidity: 64 },
        { hour: 11, temp: 6, humidity: 59 },
        { hour: 12, temp: 7, humidity: 54 },
        { hour: 13, temp: 7, humidity: 52 },
        { hour: 14, temp: 7, humidity: 54 },
        { hour: 15, temp: 6, humidity: 59 },
        { hour: 16, temp: 5, humidity: 64 },
        { hour: 17, temp: 3, humidity: 69 },
        { hour: 18, temp: 2, humidity: 74 }
      ],
      rainChance: 17, avgTemp: 3, minTemp: -1, maxTemp: 7
    },
    // 3주차 (2/2~2/8) [5년 평년값]
    3: {
      hourly: [
        { hour: 6, temp: 0, humidity: 79 },
        { hour: 7, temp: 1, humidity: 76 },
        { hour: 8, temp: 2, humidity: 73 },
        { hour: 9, temp: 4, humidity: 68 },
        { hour: 10, temp: 6, humidity: 63 },
        { hour: 11, temp: 8, humidity: 58 },
        { hour: 12, temp: 9, humidity: 53 },
        { hour: 13, temp: 9, humidity: 51 },
        { hour: 14, temp: 9, humidity: 53 },
        { hour: 15, temp: 8, humidity: 58 },
        { hour: 16, temp: 6, humidity: 63 },
        { hour: 17, temp: 4, humidity: 68 },
        { hour: 18, temp: 3, humidity: 73 }
      ],
      rainChance: 20, avgTemp: 4, minTemp: 0, maxTemp: 9
    },
    // 4주차 (2/9~2/15) [5년 평년값]
    4: {
      hourly: [
        { hour: 6, temp: 1, humidity: 77 },
        { hour: 7, temp: 2, humidity: 74 },
        { hour: 8, temp: 3, humidity: 71 },
        { hour: 9, temp: 5, humidity: 66 },
        { hour: 10, temp: 7, humidity: 61 },
        { hour: 11, temp: 9, humidity: 56 },
        { hour: 12, temp: 10, humidity: 51 },
        { hour: 13, temp: 10, humidity: 49 },
        { hour: 14, temp: 10, humidity: 51 },
        { hour: 15, temp: 9, humidity: 56 },
        { hour: 16, temp: 7, humidity: 61 },
        { hour: 17, temp: 5, humidity: 66 },
        { hour: 18, temp: 4, humidity: 71 }
      ],
      rainChance: 22, avgTemp: 5, minTemp: 1, maxTemp: 10
    },
    // 5주차 (2/16~2/23) [5년 평년값]
    5: {
      hourly: [
        { hour: 6, temp: 2, humidity: 75 },
        { hour: 7, temp: 4, humidity: 72 },
        { hour: 8, temp: 5, humidity: 69 },
        { hour: 9, temp: 7, humidity: 64 },
        { hour: 10, temp: 9, humidity: 59 },
        { hour: 11, temp: 11, humidity: 54 },
        { hour: 12, temp: 12, humidity: 49 },
        { hour: 13, temp: 12, humidity: 47 },
        { hour: 14, temp: 12, humidity: 49 },
        { hour: 15, temp: 11, humidity: 54 },
        { hour: 16, temp: 9, humidity: 59 },
        { hour: 17, temp: 7, humidity: 64 },
        { hour: 18, temp: 5, humidity: 69 }
      ],
      rainChance: 24, avgTemp: 7, minTemp: 2, maxTemp: 12
    },
    // 6주차 (2/24~3/2) - 발아기 [5년 평년값]
    6: {
      hourly: [
        { hour: 6, temp: 3, humidity: 73 },
        { hour: 7, temp: 5, humidity: 70 },
        { hour: 8, temp: 6, humidity: 67 },
        { hour: 9, temp: 8, humidity: 62 },
        { hour: 10, temp: 10, humidity: 57 },
        { hour: 11, temp: 12, humidity: 52 },
        { hour: 12, temp: 13, humidity: 47 },
        { hour: 13, temp: 13, humidity: 45 },
        { hour: 14, temp: 13, humidity: 47 },
        { hour: 15, temp: 12, humidity: 52 },
        { hour: 16, temp: 10, humidity: 57 },
        { hour: 17, temp: 8, humidity: 62 },
        { hour: 18, temp: 6, humidity: 67 }
      ],
      rainChance: 27, avgTemp: 8, minTemp: 3, maxTemp: 13
    },
    // 7주차 (3/3~3/9) [5년 평년값]
    7: {
      hourly: [
        { hour: 6, temp: 4, humidity: 71 },
        { hour: 7, temp: 6, humidity: 68 },
        { hour: 8, temp: 7, humidity: 65 },
        { hour: 9, temp: 9, humidity: 60 },
        { hour: 10, temp: 11, humidity: 55 },
        { hour: 11, temp: 13, humidity: 50 },
        { hour: 12, temp: 14, humidity: 45 },
        { hour: 13, temp: 14, humidity: 43 },
        { hour: 14, temp: 14, humidity: 45 },
        { hour: 15, temp: 13, humidity: 50 },
        { hour: 16, temp: 11, humidity: 55 },
        { hour: 17, temp: 9, humidity: 60 },
        { hour: 18, temp: 7, humidity: 65 }
      ],
      rainChance: 30, avgTemp: 9, minTemp: 4, maxTemp: 14
    },
    // 8주차 (3/10~3/16) [5년 평년값]
    8: {
      hourly: [
        { hour: 6, temp: 5, humidity: 69 },
        { hour: 7, temp: 7, humidity: 66 },
        { hour: 8, temp: 9, humidity: 63 },
        { hour: 9, temp: 11, humidity: 58 },
        { hour: 10, temp: 13, humidity: 53 },
        { hour: 11, temp: 15, humidity: 48 },
        { hour: 12, temp: 16, humidity: 43 },
        { hour: 13, temp: 16, humidity: 41 },
        { hour: 14, temp: 16, humidity: 43 },
        { hour: 15, temp: 15, humidity: 48 },
        { hour: 16, temp: 13, humidity: 53 },
        { hour: 17, temp: 11, humidity: 58 },
        { hour: 18, temp: 9, humidity: 63 }
      ],
      rainChance: 32, avgTemp: 10, minTemp: 5, maxTemp: 16
    },
    // 9주차 (3/17~3/23) [5년 평년값]
    9: {
      hourly: [
        { hour: 6, temp: 7, humidity: 67 },
        { hour: 7, temp: 9, humidity: 64 },
        { hour: 8, temp: 10, humidity: 61 },
        { hour: 9, temp: 12, humidity: 56 },
        { hour: 10, temp: 14, humidity: 51 },
        { hour: 11, temp: 16, humidity: 46 },
        { hour: 12, temp: 17, humidity: 41 },
        { hour: 13, temp: 17, humidity: 39 },
        { hour: 14, temp: 17, humidity: 41 },
        { hour: 15, temp: 16, humidity: 46 },
        { hour: 16, temp: 14, humidity: 51 },
        { hour: 17, temp: 12, humidity: 56 },
        { hour: 18, temp: 10, humidity: 61 }
      ],
      rainChance: 34, avgTemp: 12, minTemp: 7, maxTemp: 17
    },
    // 10주차 (3/24~3/30) [5년 평년값]
    10: {
      hourly: [
        { hour: 6, temp: 8, humidity: 65 },
        { hour: 7, temp: 10, humidity: 62 },
        { hour: 8, temp: 12, humidity: 59 },
        { hour: 9, temp: 14, humidity: 54 },
        { hour: 10, temp: 16, humidity: 49 },
        { hour: 11, temp: 18, humidity: 44 },
        { hour: 12, temp: 19, humidity: 39 },
        { hour: 13, temp: 19, humidity: 37 },
        { hour: 14, temp: 19, humidity: 39 },
        { hour: 15, temp: 18, humidity: 44 },
        { hour: 16, temp: 16, humidity: 49 },
        { hour: 17, temp: 14, humidity: 54 },
        { hour: 18, temp: 12, humidity: 59 }
      ],
      rainChance: 37, avgTemp: 13, minTemp: 8, maxTemp: 19
    },
    // 11주차 (3/31~4/6) - 개화기 [5년 평년값]
    11: {
      hourly: [
        { hour: 6, temp: 9, humidity: 63 },
        { hour: 7, temp: 11, humidity: 60 },
        { hour: 8, temp: 13, humidity: 57 },
        { hour: 9, temp: 15, humidity: 52 },
        { hour: 10, temp: 17, humidity: 47 },
        { hour: 11, temp: 19, humidity: 42 },
        { hour: 12, temp: 20, humidity: 37 },
        { hour: 13, temp: 20, humidity: 35 },
        { hour: 14, temp: 20, humidity: 37 },
        { hour: 15, temp: 19, humidity: 42 },
        { hour: 16, temp: 17, humidity: 47 },
        { hour: 17, temp: 15, humidity: 52 },
        { hour: 18, temp: 13, humidity: 57 }
      ],
      rainChance: 40, avgTemp: 15, minTemp: 9, maxTemp: 20
    },
    // 12주차 (4/7~4/13) [5년 평년값]
    12: {
      hourly: [
        { hour: 6, temp: 11, humidity: 62 },
        { hour: 7, temp: 13, humidity: 59 },
        { hour: 8, temp: 15, humidity: 55 },
        { hour: 9, temp: 17, humidity: 50 },
        { hour: 10, temp: 19, humidity: 45 },
        { hour: 11, temp: 21, humidity: 40 },
        { hour: 12, temp: 22, humidity: 35 },
        { hour: 13, temp: 22, humidity: 33 },
        { hour: 14, temp: 22, humidity: 35 },
        { hour: 15, temp: 21, humidity: 40 },
        { hour: 16, temp: 19, humidity: 45 },
        { hour: 17, temp: 17, humidity: 50 },
        { hour: 18, temp: 15, humidity: 55 }
      ],
      rainChance: 42, avgTemp: 16, minTemp: 11, maxTemp: 22
    },
    // 13주차 (4/14~4/20)
    13: {
      hourly: [
        { hour: 6, temp: 10, humidity: 64 },
        { hour: 7, temp: 12, humidity: 61 },
        { hour: 8, temp: 14, humidity: 57 },
        { hour: 9, temp: 16, humidity: 52 },
        { hour: 10, temp: 18, humidity: 47 },
        { hour: 11, temp: 20, humidity: 42 },
        { hour: 12, temp: 21, humidity: 37 },
        { hour: 13, temp: 21, humidity: 35 },
        { hour: 14, temp: 21, humidity: 37 },
        { hour: 15, temp: 20, humidity: 42 },
        { hour: 16, temp: 18, humidity: 47 },
        { hour: 17, temp: 16, humidity: 52 },
        { hour: 18, temp: 14, humidity: 57 }
      ],
      rainChance: 42, avgTemp: 15, minTemp: 10, maxTemp: 21
    },
    // 14주차 (4/21~4/27)
    14: {
      hourly: [
        { hour: 6, temp: 11, humidity: 63 },
        { hour: 7, temp: 13, humidity: 60 },
        { hour: 8, temp: 15, humidity: 56 },
        { hour: 9, temp: 17, humidity: 51 },
        { hour: 10, temp: 19, humidity: 46 },
        { hour: 11, temp: 21, humidity: 41 },
        { hour: 12, temp: 22, humidity: 36 },
        { hour: 13, temp: 22, humidity: 34 },
        { hour: 14, temp: 22, humidity: 36 },
        { hour: 15, temp: 21, humidity: 41 },
        { hour: 16, temp: 19, humidity: 46 },
        { hour: 17, temp: 17, humidity: 51 },
        { hour: 18, temp: 15, humidity: 56 }
      ],
      rainChance: 45, avgTemp: 17, minTemp: 11, maxTemp: 22
    },
    // 15주차 (4/28~5/4)
    15: {
      hourly: [
        { hour: 6, temp: 13, humidity: 62 },
        { hour: 7, temp: 15, humidity: 59 },
        { hour: 8, temp: 17, humidity: 55 },
        { hour: 9, temp: 19, humidity: 50 },
        { hour: 10, temp: 21, humidity: 45 },
        { hour: 11, temp: 23, humidity: 40 },
        { hour: 12, temp: 24, humidity: 35 },
        { hour: 13, temp: 24, humidity: 33 },
        { hour: 14, temp: 24, humidity: 35 },
        { hour: 15, temp: 23, humidity: 40 },
        { hour: 16, temp: 21, humidity: 45 },
        { hour: 17, temp: 19, humidity: 50 },
        { hour: 18, temp: 17, humidity: 55 }
      ],
      rainChance: 48, avgTemp: 18, minTemp: 13, maxTemp: 24
    },
    // 16주차 (5/5~5/11)
    16: {
      hourly: [
        { hour: 6, temp: 14, humidity: 61 },
        { hour: 7, temp: 16, humidity: 58 },
        { hour: 8, temp: 18, humidity: 54 },
        { hour: 9, temp: 20, humidity: 49 },
        { hour: 10, temp: 22, humidity: 44 },
        { hour: 11, temp: 24, humidity: 39 },
        { hour: 12, temp: 25, humidity: 34 },
        { hour: 13, temp: 25, humidity: 32 },
        { hour: 14, temp: 25, humidity: 34 },
        { hour: 15, temp: 24, humidity: 39 },
        { hour: 16, temp: 22, humidity: 44 },
        { hour: 17, temp: 20, humidity: 49 },
        { hour: 18, temp: 18, humidity: 54 }
      ],
      rainChance: 50, avgTemp: 19, minTemp: 14, maxTemp: 25
    },
    // 17주차 (5/12~5/18)
    17: {
      hourly: [
        { hour: 6, temp: 15, humidity: 60 },
        { hour: 7, temp: 17, humidity: 57 },
        { hour: 8, temp: 19, humidity: 53 },
        { hour: 9, temp: 21, humidity: 48 },
        { hour: 10, temp: 23, humidity: 43 },
        { hour: 11, temp: 25, humidity: 38 },
        { hour: 12, temp: 26, humidity: 33 },
        { hour: 13, temp: 26, humidity: 31 },
        { hour: 14, temp: 26, humidity: 33 },
        { hour: 15, temp: 25, humidity: 38 },
        { hour: 16, temp: 23, humidity: 43 },
        { hour: 17, temp: 21, humidity: 48 },
        { hour: 18, temp: 19, humidity: 53 }
      ],
      rainChance: 52, avgTemp: 20, minTemp: 15, maxTemp: 26
    },
    // 18주차 (5/19~5/25)
    18: {
      hourly: [
        { hour: 6, temp: 16, humidity: 62 },
        { hour: 7, temp: 18, humidity: 59 },
        { hour: 8, temp: 20, humidity: 55 },
        { hour: 9, temp: 22, humidity: 50 },
        { hour: 10, temp: 24, humidity: 45 },
        { hour: 11, temp: 26, humidity: 40 },
        { hour: 12, temp: 27, humidity: 35 },
        { hour: 13, temp: 27, humidity: 33 },
        { hour: 14, temp: 27, humidity: 35 },
        { hour: 15, temp: 26, humidity: 40 },
        { hour: 16, temp: 24, humidity: 45 },
        { hour: 17, temp: 22, humidity: 50 },
        { hour: 18, temp: 20, humidity: 55 }
      ],
      rainChance: 55, avgTemp: 21, minTemp: 16, maxTemp: 27
    },
    // 19주차 (5/26~6/1)
    19: {
      hourly: [
        { hour: 6, temp: 17, humidity: 65 },
        { hour: 7, temp: 19, humidity: 62 },
        { hour: 8, temp: 21, humidity: 58 },
        { hour: 9, temp: 23, humidity: 53 },
        { hour: 10, temp: 25, humidity: 48 },
        { hour: 11, temp: 27, humidity: 43 },
        { hour: 12, temp: 28, humidity: 38 },
        { hour: 13, temp: 28, humidity: 36 },
        { hour: 14, temp: 28, humidity: 38 },
        { hour: 15, temp: 27, humidity: 43 },
        { hour: 16, temp: 25, humidity: 48 },
        { hour: 17, temp: 23, humidity: 53 },
        { hour: 18, temp: 21, humidity: 58 }
      ],
      rainChance: 58, avgTemp: 22, minTemp: 17, maxTemp: 28
    },
    // 20주차 (6/2~6/8)
    20: {
      hourly: [
        { hour: 6, temp: 18, humidity: 68 },
        { hour: 7, temp: 20, humidity: 65 },
        { hour: 8, temp: 22, humidity: 61 },
        { hour: 9, temp: 24, humidity: 56 },
        { hour: 10, temp: 26, humidity: 51 },
        { hour: 11, temp: 27, humidity: 46 },
        { hour: 12, temp: 28, humidity: 41 },
        { hour: 13, temp: 28, humidity: 39 },
        { hour: 14, temp: 28, humidity: 41 },
        { hour: 15, temp: 27, humidity: 46 },
        { hour: 16, temp: 26, humidity: 51 },
        { hour: 17, temp: 24, humidity: 56 },
        { hour: 18, temp: 22, humidity: 61 }
      ],
      rainChance: 60, avgTemp: 23, minTemp: 18, maxTemp: 28
    },
    // 21주차 (6/9~6/15)
    21: {
      hourly: [
        { hour: 6, temp: 19, humidity: 72 },
        { hour: 7, temp: 21, humidity: 69 },
        { hour: 8, temp: 23, humidity: 65 },
        { hour: 9, temp: 25, humidity: 60 },
        { hour: 10, temp: 27, humidity: 55 },
        { hour: 11, temp: 28, humidity: 50 },
        { hour: 12, temp: 29, humidity: 45 },
        { hour: 13, temp: 29, humidity: 43 },
        { hour: 14, temp: 29, humidity: 45 },
        { hour: 15, temp: 28, humidity: 50 },
        { hour: 16, temp: 27, humidity: 55 },
        { hour: 17, temp: 25, humidity: 60 },
        { hour: 18, temp: 23, humidity: 65 }
      ],
      rainChance: 65, avgTemp: 24, minTemp: 19, maxTemp: 29
    },
    // 22주차 (6/16~6/22)
    22: {
      hourly: [
        { hour: 6, temp: 20, humidity: 75 },
        { hour: 7, temp: 22, humidity: 72 },
        { hour: 8, temp: 24, humidity: 68 },
        { hour: 9, temp: 26, humidity: 63 },
        { hour: 10, temp: 28, humidity: 58 },
        { hour: 11, temp: 29, humidity: 53 },
        { hour: 12, temp: 30, humidity: 48 },
        { hour: 13, temp: 30, humidity: 46 },
        { hour: 14, temp: 30, humidity: 48 },
        { hour: 15, temp: 29, humidity: 53 },
        { hour: 16, temp: 28, humidity: 58 },
        { hour: 17, temp: 26, humidity: 63 },
        { hour: 18, temp: 24, humidity: 68 }
      ],
      rainChance: 70, avgTemp: 25, minTemp: 20, maxTemp: 30
    },
    // 23주차 (6/23~6/29) - 장마 시작
    23: {
      hourly: [
        { hour: 6, temp: 21, humidity: 78 },
        { hour: 7, temp: 23, humidity: 75 },
        { hour: 8, temp: 25, humidity: 71 },
        { hour: 9, temp: 26, humidity: 66 },
        { hour: 10, temp: 28, humidity: 61 },
        { hour: 11, temp: 29, humidity: 56 },
        { hour: 12, temp: 30, humidity: 51 },
        { hour: 13, temp: 30, humidity: 49 },
        { hour: 14, temp: 30, humidity: 51 },
        { hour: 15, temp: 29, humidity: 56 },
        { hour: 16, temp: 28, humidity: 61 },
        { hour: 17, temp: 26, humidity: 66 },
        { hour: 18, temp: 25, humidity: 71 }
      ],
      rainChance: 75, avgTemp: 25, minTemp: 21, maxTemp: 30
    },
    // 24주차 (6/30~7/6)
    24: {
      hourly: [
        { hour: 6, temp: 22, humidity: 80 },
        { hour: 7, temp: 24, humidity: 77 },
        { hour: 8, temp: 26, humidity: 73 },
        { hour: 9, temp: 27, humidity: 68 },
        { hour: 10, temp: 29, humidity: 63 },
        { hour: 11, temp: 30, humidity: 58 },
        { hour: 12, temp: 31, humidity: 53 },
        { hour: 13, temp: 31, humidity: 51 },
        { hour: 14, temp: 31, humidity: 53 },
        { hour: 15, temp: 30, humidity: 58 },
        { hour: 16, temp: 29, humidity: 63 },
        { hour: 17, temp: 27, humidity: 68 },
        { hour: 18, temp: 26, humidity: 73 }
      ],
      rainChance: 72, avgTemp: 26, minTemp: 22, maxTemp: 31
    },
    // 25주차 (7/7~7/13)
    25: {
      hourly: [
        { hour: 6, temp: 23, humidity: 82 },
        { hour: 7, temp: 25, humidity: 79 },
        { hour: 8, temp: 27, humidity: 75 },
        { hour: 9, temp: 28, humidity: 70 },
        { hour: 10, temp: 30, humidity: 65 },
        { hour: 11, temp: 31, humidity: 60 },
        { hour: 12, temp: 32, humidity: 55 },
        { hour: 13, temp: 32, humidity: 53 },
        { hour: 14, temp: 32, humidity: 55 },
        { hour: 15, temp: 31, humidity: 60 },
        { hour: 16, temp: 30, humidity: 65 },
        { hour: 17, temp: 28, humidity: 70 },
        { hour: 18, temp: 27, humidity: 75 }
      ],
      rainChance: 68, avgTemp: 27, minTemp: 23, maxTemp: 32
    },
    // 26주차 (7/14~7/20)
    26: {
      hourly: [
        { hour: 6, temp: 24, humidity: 80 },
        { hour: 7, temp: 26, humidity: 77 },
        { hour: 8, temp: 28, humidity: 73 },
        { hour: 9, temp: 29, humidity: 68 },
        { hour: 10, temp: 31, humidity: 63 },
        { hour: 11, temp: 32, humidity: 58 },
        { hour: 12, temp: 33, humidity: 53 },
        { hour: 13, temp: 33, humidity: 51 },
        { hour: 14, temp: 33, humidity: 53 },
        { hour: 15, temp: 32, humidity: 58 },
        { hour: 16, temp: 31, humidity: 63 },
        { hour: 17, temp: 29, humidity: 68 },
        { hour: 18, temp: 28, humidity: 73 }
      ],
      rainChance: 65, avgTemp: 28, minTemp: 24, maxTemp: 33
    },
    // 27주차 (7/21~7/27)
    27: {
      hourly: [
        { hour: 6, temp: 25, humidity: 78 },
        { hour: 7, temp: 27, humidity: 75 },
        { hour: 8, temp: 28, humidity: 71 },
        { hour: 9, temp: 30, humidity: 66 },
        { hour: 10, temp: 31, humidity: 61 },
        { hour: 11, temp: 32, humidity: 56 },
        { hour: 12, temp: 33, humidity: 51 },
        { hour: 13, temp: 33, humidity: 49 },
        { hour: 14, temp: 33, humidity: 51 },
        { hour: 15, temp: 32, humidity: 56 },
        { hour: 16, temp: 31, humidity: 61 },
        { hour: 17, temp: 30, humidity: 66 },
        { hour: 18, temp: 28, humidity: 71 }
      ],
      rainChance: 55, avgTemp: 29, minTemp: 25, maxTemp: 33
    },
    // 28주차 (7/28~8/3) - 수확기
    28: {
      hourly: [
        { hour: 6, temp: 25, humidity: 76 },
        { hour: 7, temp: 27, humidity: 73 },
        { hour: 8, temp: 29, humidity: 69 },
        { hour: 9, temp: 30, humidity: 64 },
        { hour: 10, temp: 32, humidity: 59 },
        { hour: 11, temp: 33, humidity: 54 },
        { hour: 12, temp: 34, humidity: 49 },
        { hour: 13, temp: 34, humidity: 47 },
        { hour: 14, temp: 34, humidity: 49 },
        { hour: 15, temp: 33, humidity: 54 },
        { hour: 16, temp: 32, humidity: 59 },
        { hour: 17, temp: 30, humidity: 64 },
        { hour: 18, temp: 29, humidity: 69 }
      ],
      rainChance: 45, avgTemp: 29, minTemp: 25, maxTemp: 34
    }
  };
  
  // 29~52주차는 간략화 (가을~겨울)
  for (let w = 29; w <= 52; w++) {
    let baseTemp, humidity, rain;
    if (w <= 32) { // 8월
      baseTemp = 28 - (w - 28) * 0.5;
      humidity = 75;
      rain = 50;
    } else if (w <= 36) { // 9월
      baseTemp = 24 - (w - 32) * 1.5;
      humidity = 70;
      rain = 45;
    } else if (w <= 40) { // 10월
      baseTemp = 18 - (w - 36) * 2;
      humidity = 65;
      rain = 35;
    } else if (w <= 44) { // 11월
      baseTemp = 10 - (w - 40) * 2;
      humidity = 60;
      rain = 30;
    } else if (w <= 48) { // 12월
      baseTemp = 2 - (w - 44) * 1.5;
      humidity = 65;
      rain = 25;
    } else { // 1월 초
      baseTemp = -4;
      humidity = 70;
      rain = 20;
    }
    
    HISTORICAL_HOURLY_CLIMATE[w] = {
      hourly: [
        { hour: 6, temp: Math.round(baseTemp - 6), humidity: Math.round(humidity + 10) },
        { hour: 7, temp: Math.round(baseTemp - 5), humidity: Math.round(humidity + 8) },
        { hour: 8, temp: Math.round(baseTemp - 3), humidity: Math.round(humidity + 5) },
        { hour: 9, temp: Math.round(baseTemp - 1), humidity: Math.round(humidity) },
        { hour: 10, temp: Math.round(baseTemp + 1), humidity: Math.round(humidity - 5) },
        { hour: 11, temp: Math.round(baseTemp + 3), humidity: Math.round(humidity - 10) },
        { hour: 12, temp: Math.round(baseTemp + 4), humidity: Math.round(humidity - 15) },
        { hour: 13, temp: Math.round(baseTemp + 4), humidity: Math.round(humidity - 17) },
        { hour: 14, temp: Math.round(baseTemp + 4), humidity: Math.round(humidity - 15) },
        { hour: 15, temp: Math.round(baseTemp + 3), humidity: Math.round(humidity - 10) },
        { hour: 16, temp: Math.round(baseTemp + 1), humidity: Math.round(humidity - 5) },
        { hour: 17, temp: Math.round(baseTemp - 1), humidity: Math.round(humidity) },
        { hour: 18, temp: Math.round(baseTemp - 3), humidity: Math.round(humidity + 5) }
      ],
      rainChance: rain,
      avgTemp: Math.round(baseTemp),
      minTemp: Math.round(baseTemp - 6),
      maxTemp: Math.round(baseTemp + 4)
    };
  }
  
  // 작업 불가 요일 (0=일요일, 3=수요일)
  const BLOCKED_DAYS = [0, 3];
  
  // =============================================
  // 이상기후 감지 기준
  // =============================================
  
  const WEATHER_ALERTS = {
    EXTREME_HEAT: {
      name: '🔥 이상고온',
      condition: (hourly) => hourly.some(h => h.temp >= 35),
      threshold: 35,
      color: '#ef4444',
      taskImpact: {
        block: ['GA', 'MERIT', 'SPRAY', 'FOLIAR', 'HARVEST'], // 이 작업 금지
        allow: ['WATER', 'VENTILATION'], // 이 작업만 허용
        warning: '고온으로 약해/호르몬 흡수 불량, 일소과 위험'
      },
      recommendation: '오전 6~9시 또는 저녁 작업 권장, 차광 필수'
    },
    HEAT_WAVE: {
      name: '🌡️ 폭염',
      condition: (hourly) => {
        const hotHours = hourly.filter(h => h.temp >= 33);
        return hotHours.length >= 3;
      },
      threshold: 33,
      color: '#f97316',
      taskImpact: {
        block: ['GA', 'MERIT', 'SPRAY'],
        prefer: ['WATER', 'VENTILATION'],
        warning: '폭염 시 호르몬제/약제 효과 저하'
      },
      recommendation: '오전 일찍 또는 저녁 작업, 관수량 20% 증가'
    },
    TROPICAL_NIGHT: {
      name: '🌙 열대야',
      condition: (hourly) => {
        const nightHours = hourly.filter(h => h.hour >= 21 || h.hour <= 6);
        return nightHours.length > 0 && nightHours.every(h => h.temp >= 25);
      },
      threshold: 25,
      color: '#a855f7',
      taskImpact: {
        block: [],
        warning: '야간 호흡 증가로 당도 축적 저해'
      },
      recommendation: '야간 환기 강화, 당도 관리 주의'
    },
    HEAVY_RAIN: {
      name: '🌧️ 폭우',
      condition: (hourly) => hourly.some(h => h.rainChance >= 80 || h.rainMM >= 30),
      threshold: 80,
      color: '#3b82f6',
      taskImpact: {
        block: ['GA', 'MERIT', 'SPRAY', 'FOLIAR', 'HARVEST', 'BAGGING'],
        allow: ['VENTILATION'],
        warning: '폭우 시 모든 야외/살포 작업 금지'
      },
      recommendation: '배수로 점검, 하우스 밀폐, 작업 연기'
    },
    MONSOON: {
      name: '☔ 장마',
      condition: (hourly, dayData) => {
        const avgRain = hourly.reduce((sum, h) => sum + (h.rainChance || 0), 0) / hourly.length;
        const avgHumid = hourly.reduce((sum, h) => sum + (h.humidity || 0), 0) / hourly.length;
        return avgRain >= 60 && avgHumid >= 80;
      },
      threshold: 60,
      color: '#06b6d4',
      taskImpact: {
        block: ['SPRAY', 'FOLIAR'], // 약제는 비 오기 전 6시간 필요
        prefer: ['VENTILATION', 'PRUNING'],
        warning: '고습으로 병해 발생 위험 증가'
      },
      recommendation: '잿빛곰팡이, 노균병 예방 강화, 환기 필수'
    },
    LOCALIZED_STORM: {
      name: '⛈️ 국지성 호우',
      condition: (hourly) => hourly.some(h => h.rainMM >= 50 || (h.rainChance >= 90 && h.rainMM >= 20)),
      threshold: 50,
      color: '#1e40af',
      taskImpact: {
        block: ['GA', 'MERIT', 'SPRAY', 'FOLIAR', 'HARVEST', 'BAGGING', 'PRUNING'],
        allow: [],
        warning: '호우 시 모든 작업 중단'
      },
      recommendation: '시설 점검, 배수 확인, 안전 우선'
    },
    COLD_SNAP: {
      name: '❄️ 이상저온',
      condition: (hourly, dayData, weekNo) => {
        // 봄철(3~5월, 주차 6~18)에 10°C 이하
        if (weekNo >= 6 && weekNo <= 18) {
          return hourly.some(h => h.temp <= 5);
        }
        return false;
      },
      threshold: 5,
      color: '#0ea5e9',
      taskImpact: {
        block: ['GA', 'MERIT'],
        warning: '저온으로 호르몬제 흡수 불량'
      },
      recommendation: '보온 강화, 호르몬 처리 연기'
    },
    FROST: {
      name: '🥶 서리',
      condition: (hourly) => hourly.some(h => h.hour >= 5 && h.hour <= 7 && h.temp <= 0),
      threshold: 0,
      color: '#e0f2fe',
      taskImpact: {
        block: ['GA', 'MERIT', 'SPRAY', 'FOLIAR'],
        warning: '서리 피해 위험'
      },
      recommendation: '보온덮개, 살수, 연무 방제'
    }
  };
  
  // =============================================
  // 이상기후 감지 함수
  // =============================================
  
  function detectWeatherAlerts(dayWeather, weekNo = 1) {
    const alerts = [];
    
    if (!dayWeather || !dayWeather.hourly) return alerts;
    
    const hourly = dayWeather.hourly;
    
    Object.entries(WEATHER_ALERTS).forEach(([key, alert]) => {
      try {
        if (alert.condition(hourly, dayWeather, weekNo)) {
          alerts.push({
            type: key,
            ...alert,
            detected: true
          });
        }
      } catch (e) {
        // 조건 체크 실패 시 무시
      }
    });
    
    return alerts;
  }
  
  // 이상기후 상황에서 작업 가능 여부 확인
  function canDoTaskInAlerts(taskType, alerts) {
    if (alerts.length === 0) return { canDo: true, warnings: [] };
    
    const warnings = [];
    let canDo = true;
    
    for (const alert of alerts) {
      if (alert.taskImpact.block && alert.taskImpact.block.includes(taskType)) {
        canDo = false;
        warnings.push({
          alert: alert.name,
          reason: alert.taskImpact.warning,
          recommendation: alert.recommendation
        });
      }
    }
    
    return { canDo, warnings };
  }
  
  // 날씨 무관 작업용 - 빈 시간대 찾기
  function findAvailableHour(sunTimes, blockedSlots) {
    const sunrise = Math.ceil(sunTimes.rise);
    const sunset = Math.floor(sunTimes.set);
    
    // 일출~일몰 사이에서 빈 시간 찾기
    for (let hour = sunrise; hour < sunset; hour++) {
      const isBlocked = blockedSlots.some(slot => 
        hour >= slot.start && hour < slot.end
      );
      if (!isBlocked) {
        return hour;
      }
    }
    return null;
  }
  
  // 이상기후 시 최적 시간대 찾기
  function findSafeTimeSlot(taskType, dayWeather, sunTimes, blockedSlots, alerts) {
    if (!dayWeather || !dayWeather.hourly) return null;
    
    const conditions = TASK_CONDITIONS[taskType] || TASK_CONDITIONS.GENERAL;
    const sunrise = Math.ceil(sunTimes.rise);
    const sunset = Math.floor(sunTimes.set);
    
    // 이상고온/폭염 시 이른 오전 또는 저녁 선호
    const hasHeatAlert = alerts.some(a => a.type === 'EXTREME_HEAT' || a.type === 'HEAT_WAVE');
    
    const availableHours = dayWeather.hourly.filter(h => {
      if (h.hour < sunrise || h.hour >= sunset) return false;
      
      // 블록된 시간 체크
      const isBlocked = blockedSlots.some(slot => 
        h.hour >= slot.start && h.hour < slot.end
      );
      if (isBlocked) return false;
      
      // 폭염 시 오전 9시 이전 또는 17시 이후만 허용
      if (hasHeatAlert && h.hour >= 10 && h.hour <= 16) {
        return false;
      }
      
      return true;
    });
    
    // 조건에 맞는 시간 필터링
    const suitableHours = matchTaskToWeather(taskType, availableHours);
    
    if (suitableHours.length === 0) return null;
    
    // 오전 선호 작업인 경우 오전 시간대 우선
    if (conditions.preferMorning || hasHeatAlert) {
      const morningHours = suitableHours.filter(h => h.hour < 10);
      if (morningHours.length > 0) {
        return morningHours[0];
      }
    }
    
    return suitableHours[0];
  }
  
  // 작업 유형별 최적 조건
  const TASK_CONDITIONS = {
    // ===== 날씨 민감 작업 (weatherSensitive: true) =====
    'GA': {
      name: '지베렐린(GA) 처리',
      weatherSensitive: true, // 날씨에 민감
      tempMin: 20, tempMax: 28,
      humidityMin: 50, humidityMax: 70,
      rainMax: 0,
      preferMorning: true,
      duration: 3,
      priority: 1
    },
    'MERIT': {
      name: '메리트청 처리',
      weatherSensitive: true,
      tempMin: 18, tempMax: 28,
      humidityMin: 50, humidityMax: 75,
      rainMax: 0,
      preferMorning: true,
      duration: 2,
      priority: 1
    },
    'SPRAY': {
      name: '약제 살포',
      weatherSensitive: true,
      tempMin: 15, tempMax: 30,
      humidityMin: 40, humidityMax: 80,
      rainMax: 0,
      preferMorning: true,
      duration: 2,
      priority: 2
    },
    'FOLIAR': {
      name: '엽면시비',
      weatherSensitive: true,
      tempMin: 18, tempMax: 28,
      humidityMin: 50, humidityMax: 80,
      rainMax: 0,
      preferMorning: true,
      duration: 2,
      priority: 2
    },
    'WATER': {
      name: '관수',
      weatherSensitive: true,
      tempMin: 10, tempMax: 35,
      humidityMin: 0, humidityMax: 100,
      rainMax: 50,
      preferMorning: true,
      duration: 1,
      priority: 3
    },
    'PRUNING': {
      name: '전정/유인/적과',
      weatherSensitive: true,
      tempMin: 10, tempMax: 30,
      humidityMin: 40, humidityMax: 85,
      rainMax: 20,
      preferMorning: false,
      duration: 4,
      priority: 2
    },
    'HWASOO': {
      name: '화수정형',
      weatherSensitive: true,
      tempMin: 15, tempMax: 28,
      humidityMin: 50, humidityMax: 80,
      rainMax: 0,
      preferMorning: true,
      duration: 4,
      priority: 1
    },
    'BAGGING': {
      name: '봉지씌우기',
      weatherSensitive: true,
      tempMin: 15, tempMax: 32,
      humidityMin: 40, humidityMax: 85,
      rainMax: 30,
      preferMorning: false,
      duration: 6,
      priority: 2
    },
    'HARVEST': {
      name: '수확',
      weatherSensitive: true,
      tempMin: 15, tempMax: 28,
      humidityMin: 40, humidityMax: 75,
      rainMax: 0,
      preferMorning: true,
      duration: 6,
      priority: 1
    },
    'VENTILATION': {
      name: '환기 관리',
      weatherSensitive: true,
      tempMin: 0, tempMax: 40,
      humidityMin: 0, humidityMax: 100,
      rainMax: 100,
      preferMorning: false,
      duration: 1,
      priority: 4
    },
    'SOIL_CHECK': {
      name: '토양 점검',
      weatherSensitive: true,
      tempMin: 10, tempMax: 30,
      humidityMin: 40, humidityMax: 90,
      rainMax: 50,
      preferMorning: false,
      duration: 1,
      priority: 3
    },
    'MULCHING': {
      name: '멀칭 작업',
      weatherSensitive: true,
      tempMin: 5, tempMax: 30,
      humidityMin: 40, humidityMax: 85,
      rainMax: 10,
      preferMorning: false,
      duration: 4,
      priority: 2
    },
    'PF': {
      name: '미생물제 투입',
      weatherSensitive: true,
      tempMin: 15, tempMax: 30,
      humidityMin: 50, humidityMax: 85,
      rainMax: 30,
      preferMorning: true,
      duration: 1,
      priority: 3
    },
    
    // ===== 날씨 무관 작업 (weatherSensitive: false) =====
    'PURCHASE': {
      name: '자재 구입',
      weatherSensitive: false, // 날씨 무관
      duration: 2,
      priority: 5
    },
    'EQUIPMENT': {
      name: '시설/장비 점검',
      weatherSensitive: false,
      duration: 2,
      priority: 4
    },
    'PLANNING': {
      name: '계획/기록',
      weatherSensitive: false,
      duration: 1,
      priority: 5
    },
    'HEATING': {
      name: '난방/보온 관련',
      weatherSensitive: false,
      duration: 2,
      priority: 4
    },
    'CLEANING': {
      name: '정리/청소',
      weatherSensitive: false,
      duration: 2,
      priority: 5
    },
    'OBSERVATION': {
      name: '관찰/확인',
      weatherSensitive: false,
      duration: 1,
      priority: 4
    },
    'SENSOR': {
      name: '센서/측정',
      weatherSensitive: false,
      duration: 1,
      priority: 4
    },
    
    // 기본값
    'GENERAL': {
      name: '일반 작업',
      weatherSensitive: false,
      tempMin: 5, tempMax: 35,
      humidityMin: 30, humidityMax: 90,
      rainMax: 30,
      preferMorning: false,
      duration: 2,
      priority: 4
    }
  };
  
  // =============================================
  // 상태 관리
  // =============================================
  
  let state = {
    weekStart: null, // 이번 주 일요일
    weatherData: null, // 7일 날씨 데이터
    sunTimes: {}, // 일출/일몰 시간
    externalEvents: [], // 외부 일정
    weeklyTasks: [], // 이번 주 작업
    scheduledTasks: [], // 배치된 작업
    location: 'Gimcheon'
  };
  
  // =============================================
  // 유틸리티 함수
  // =============================================
  
  function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  function formatDate(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${m}/${d}`;
  }
  
  function formatDateFull(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  
  function getDayName(dayIndex) {
    return DAYS_FULL[dayIndex];
  }
  
  function isBlockedDay(dayIndex) {
    return BLOCKED_DAYS.includes(dayIndex);
  }
  
  // 일출/일몰 시간 계산 (한국 중부 기준 근사값)
  function getSunTimes(date) {
    const month = date.getMonth();
    // 월별 대략적인 일출/일몰 시간 (한국 중부)
    const sunData = [
      { rise: 7.5, set: 17.5 },  // 1월
      { rise: 7.0, set: 18.0 },  // 2월
      { rise: 6.5, set: 18.5 },  // 3월
      { rise: 6.0, set: 19.0 },  // 4월
      { rise: 5.5, set: 19.5 },  // 5월
      { rise: 5.2, set: 20.0 },  // 6월
      { rise: 5.3, set: 19.8 },  // 7월
      { rise: 5.7, set: 19.3 },  // 8월
      { rise: 6.2, set: 18.5 },  // 9월
      { rise: 6.5, set: 17.8 },  // 10월
      { rise: 7.0, set: 17.3 },  // 11월
      { rise: 7.4, set: 17.2 }   // 12월
    ];
    return sunData[month];
  }
  
  // =============================================
  // 날씨 데이터 처리
  // =============================================
  
  async function fetchWeatherData(location) {
    try {
      const response = await fetch(`https://wttr.in/${location}?format=j1`);
      if (!response.ok) throw new Error('Weather fetch failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('날씨 데이터 로드 실패:', error);
      return null;
    }
  }
  
  function parseHourlyWeather(weatherData) {
    if (!weatherData || !weatherData.weather) return {};
    
    const hourlyByDate = {};
    
    weatherData.weather.forEach((day, dayIndex) => {
      const dateStr = day.date;
      hourlyByDate[dateStr] = {
        date: dateStr,
        minTemp: parseInt(day.mintempC),
        maxTemp: parseInt(day.maxtempC),
        isRealtime: true, // 실시간 데이터 표시
        hourly: []
      };
      
      day.hourly.forEach(h => {
        const hour = parseInt(h.time) / 100;
        hourlyByDate[dateStr].hourly.push({
          hour: hour,
          temp: parseInt(h.tempC),
          humidity: parseInt(h.humidity),
          rainChance: parseInt(h.chanceofrain),
          rainMM: parseFloat(h.precipMM),
          weatherCode: h.weatherCode,
          desc: h.lang_ko?.[0]?.value || h.weatherDesc[0].value
        });
      });
    });
    
    return hourlyByDate;
  }
  
  // 작년 주차별 기후 데이터 가져오기
  function getHistoricalClimate(weekNo) {
    return HISTORICAL_HOURLY_CLIMATE[weekNo] || HISTORICAL_HOURLY_CLIMATE[1];
  }
  
  // 특정 날짜의 예상 시간별 날씨 (실시간 or 작년 데이터)
  function getWeatherForDate(dateStr, weatherData, weekNo, useHistoricalOnly = false) {
    // 작년 데이터만 사용 모드
    if (useHistoricalOnly) {
      const historical = getHistoricalClimate(weekNo);
      return {
        date: dateStr,
        minTemp: historical.minTemp,
        maxTemp: historical.maxTemp,
        isRealtime: false,
        isHistorical: true,
        hourly: historical.hourly.map(h => ({
          ...h,
          rainChance: historical.rainChance,
          rainMM: 0,
          desc: '작년 평균'
        }))
      };
    }
    
    // 실시간 데이터가 있으면 사용
    if (weatherData && weatherData[dateStr]) {
      return weatherData[dateStr];
    }
    
    // 없으면 작년 동일 주차 데이터 사용
    const historical = getHistoricalClimate(weekNo);
    return {
      date: dateStr,
      minTemp: historical.minTemp,
      maxTemp: historical.maxTemp,
      isRealtime: false, // 작년 데이터 표시
      isHistorical: true,
      hourly: historical.hourly.map(h => ({
        ...h,
        rainChance: historical.rainChance,
        rainMM: 0,
        desc: '작년 평균'
      }))
    };
  }
  
  // =============================================
  // 작업 조건 매칭
  // =============================================
  
  function matchTaskToWeather(taskType, hourlyWeather) {
    const conditions = TASK_CONDITIONS[taskType] || TASK_CONDITIONS.GENERAL;
    
    return hourlyWeather.filter(h => {
      const tempOK = h.temp >= conditions.tempMin && h.temp <= conditions.tempMax;
      const humidOK = h.humidity >= conditions.humidityMin && h.humidity <= conditions.humidityMax;
      const rainOK = h.rainChance <= conditions.rainMax;
      return tempOK && humidOK && rainOK;
    });
  }
  
  function findBestTimeSlot(taskType, dayWeather, sunTimes, blockedSlots = []) {
    const conditions = TASK_CONDITIONS[taskType] || TASK_CONDITIONS.GENERAL;
    const sunrise = Math.ceil(sunTimes.rise);
    const sunset = Math.floor(sunTimes.set);
    
    // 사용 가능한 시간대 찾기
    const availableHours = dayWeather.hourly.filter(h => {
      // 일출~일몰 사이
      if (h.hour < sunrise || h.hour >= sunset) return false;
      
      // 블록된 시간 체크
      const isBlocked = blockedSlots.some(slot => 
        h.hour >= slot.start && h.hour < slot.end
      );
      if (isBlocked) return false;
      
      return true;
    });
    
    // 조건에 맞는 시간 필터링
    const suitableHours = matchTaskToWeather(taskType, availableHours);
    
    if (suitableHours.length === 0) return null;
    
    // 오전 선호 작업인 경우 오전 시간대 우선
    if (conditions.preferMorning) {
      const morningHours = suitableHours.filter(h => h.hour < 12);
      if (morningHours.length > 0) {
        return morningHours[0];
      }
    }
    
    return suitableHours[0];
  }
  
  // =============================================
  // 작업 분류
  // =============================================
  
  function classifyTask(taskText) {
    const text = taskText.toLowerCase();
    
    // ===== 날씨 무관 작업 (먼저 체크) =====
    // 자재 구입
    if (text.includes('구입') || text.includes('구매') || text.includes('자재') || 
        text.includes('준비 목록') || text.includes('예산')) return 'PURCHASE';
    
    // 난방/보온 관련
    if (text.includes('난방') || text.includes('연료') || text.includes('보온') || 
        text.includes('가온') || text.includes('피복') || text.includes('커튼')) return 'HEATING';
    
    // 시설/장비 점검
    if (text.includes('시설') || text.includes('장비') || text.includes('테스트') ||
        text.includes('점검') && (text.includes('시설') || text.includes('장비') || text.includes('난방'))) return 'EQUIPMENT';
    
    // 계획/기록
    if (text.includes('계획') || text.includes('기록') || text.includes('메모') || 
        text.includes('분석') || text.includes('개선점') || text.includes('피드백')) return 'PLANNING';
    
    // 정리/청소
    if (text.includes('정리') || text.includes('수거') || text.includes('소각') || 
        text.includes('파쇄') || text.includes('폐비닐')) return 'CLEANING';
    
    // 관찰/확인
    if (text.includes('확인') || text.includes('관찰') || text.includes('상태') ||
        (text.includes('체크') && !text.includes('토양'))) return 'OBSERVATION';
    
    // 센서/측정
    if (text.includes('센서') || text.includes('측정기') || text.includes('설치') && 
        (text.includes('센서') || text.includes('지온'))) return 'SENSOR';
    
    // ===== 날씨 민감 작업 =====
    // GA 처리
    if (text.includes('ga') || text.includes('지베렐린') || text.includes('지베린')) return 'GA';
    
    // 메리트청
    if (text.includes('메리트청') || text.includes('메리트')) return 'MERIT';
    
    // 약제 살포
    if (text.includes('약제') || text.includes('살포') || text.includes('방제') || 
        text.includes('살균') || text.includes('살충')) return 'SPRAY';
    
    // 엽면시비
    if (text.includes('엽면')) return 'FOLIAR';
    
    // 관수
    if (text.includes('관수')) return 'WATER';
    
    // 전정/유인/적과
    if (text.includes('전정') || text.includes('유인') || text.includes('적과') || 
        text.includes('순관리') || text.includes('적심') || text.includes('송이 정리')) return 'PRUNING';
    
    // 화수정형
    if (text.includes('화수정형') || text.includes('화방') || text.includes('꽃송이')) return 'HWASOO';
    
    // 봉지씌우기
    if (text.includes('봉지')) return 'BAGGING';
    
    // 수확
    if (text.includes('수확') || text.includes('선별')) return 'HARVEST';
    
    // 환기
    if (text.includes('환기')) return 'VENTILATION';
    
    // 토양 점검
    if (text.includes('토양')) return 'SOIL_CHECK';
    
    // 멀칭
    if (text.includes('멀칭')) return 'MULCHING';
    
    // 미생물제
    if (text.includes('미생물') || text.includes('pf')) return 'PF';
    
    // 기본값 (날씨 무관)
    return 'GENERAL';
  }
  
  // =============================================
  // 스케줄링 로직
  // =============================================
  
  function scheduleTasks(tasks, weatherByDate, externalEvents, weekNo, useHistoricalOnly = true) {
    const scheduled = [];
    const weekStart = state.weekStart;
    
    // 작업을 우선순위별로 정렬
    const sortedTasks = tasks.map(t => {
      const taskType = t.taskType || classifyTask(t.text);
      const conditions = TASK_CONDITIONS[taskType] || TASK_CONDITIONS.GENERAL;
      return {
        ...t,
        type: taskType,
        conditions: {
          ...conditions,
          weatherSensitive: t.weatherSensitive !== undefined ? t.weatherSensitive : conditions.weatherSensitive,
          duration: t.duration || conditions.duration
        }
      };
    }).sort((a, b) => a.conditions.priority - b.conditions.priority);
    
    // 각 날짜별 블록된 시간 관리
    const blockedByDate = {};
    
    // 외부 일정으로 블록된 시간 초기화
    externalEvents.forEach(event => {
      const dateStr = event.date;
      if (!blockedByDate[dateStr]) blockedByDate[dateStr] = [];
      blockedByDate[dateStr].push({
        start: event.startHour,
        end: event.endHour,
        reason: event.name
      });
    });
    
    // 7일 날씨 데이터 준비 (작년 데이터 우선 사용)
    const fullWeatherByDate = {};
    const alertsByDate = {}; // 날짜별 이상기후 알림
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = formatDateFull(date);
      // 작년 데이터 기준으로 작업 배치 (useHistoricalOnly = true)
      fullWeatherByDate[dateStr] = getWeatherForDate(dateStr, weatherByDate, weekNo, useHistoricalOnly);
      
      // 이상기후 감지
      alertsByDate[dateStr] = detectWeatherAlerts(fullWeatherByDate[dateStr], weekNo);
    }
    
    // 각 작업 배치
    sortedTasks.forEach(task => {
      let assigned = false;
      let taskWarnings = [];
      const isWeatherSensitive = task.conditions.weatherSensitive !== false; // 기본값은 true
      
      // 선호 요일이 있는 경우 해당 요일들 먼저 시도
      const preferredDays = task.preferredDays || (task.preferredDay !== undefined ? [task.preferredDay] : null);
      const dayOrder = preferredDays 
        ? [...preferredDays.filter(d => !isBlockedDay(d)), ...Array.from({length: 7}, (_, i) => i).filter(d => !preferredDays.includes(d) && !isBlockedDay(d))]
        : Array.from({length: 7}, (_, i) => i);
      
      // 7일 순회 (선호 요일 우선)
      for (const dayIndex of dayOrder) {
        if (assigned) break;
        
        const date = new Date(weekStart);
        // dayIndex를 기준으로 날짜 계산
        const weekStartDay = weekStart.getDay();
        const daysToAdd = (dayIndex - weekStartDay + 7) % 7;
        date.setDate(weekStart.getDate() + daysToAdd);
        const dateStr = formatDateFull(date);
        
        // 블록된 요일 건너뛰기
        if (isBlockedDay(dayIndex)) continue;
        
        // 해당 날짜 날씨 데이터 (실시간 또는 작년)
        const dayWeather = fullWeatherByDate[dateStr];
        
        // 일출/일몰 시간
        const sunTimes = getSunTimes(date);
        
        // 블록된 시간 슬롯
        const blockedSlots = blockedByDate[dateStr] || [];
        
        // ===== 날씨 무관 작업 처리 =====
        if (!isWeatherSensitive) {
          // 선호 시작 시간이 있으면 그 시간 사용, 없으면 빈 시간대에 배치
          const preferredStartHour = task.startHour;
          let availableHour;
          
          if (preferredStartHour !== undefined) {
            // 선호 시간이 블록되어 있지 않은지 확인
            const duration = task.conditions.duration || 2;
            const isBlocked = blockedSlots.some(slot => 
              (preferredStartHour >= slot.start && preferredStartHour < slot.end) ||
              (preferredStartHour + duration > slot.start && preferredStartHour + duration <= slot.end)
            );
            availableHour = isBlocked ? findAvailableHour(sunTimes, blockedSlots) : preferredStartHour;
          } else {
            availableHour = findAvailableHour(sunTimes, blockedSlots);
          }
          
          if (availableHour !== null) {
            const duration = task.conditions.duration || 2;
            
            scheduled.push({
              task: task.text,
              taskType: task.type,
              date: dateStr,
              dayIndex: dayIndex,
              dayName: getDayName(dayIndex),
              startHour: availableHour,
              endHour: availableHour + duration,
              weather: null, // 날씨 무관
              weatherSensitive: false,
              detail: task.detail || null,
              conditions: task.conditions
            });
            
            // 해당 시간 블록 추가
            if (!blockedByDate[dateStr]) blockedByDate[dateStr] = [];
            blockedByDate[dateStr].push({
              start: availableHour,
              end: availableHour + duration,
              reason: task.text
            });
            
            assigned = true;
          }
          continue;
        }
        
        // ===== 날씨 민감 작업 처리 =====
        if (!dayWeather) continue;
        
        // 해당 날짜 이상기후 알림
        const dayAlerts = alertsByDate[dateStr] || [];
        
        // 이상기후 상황에서 작업 가능 여부 확인
        const { canDo, warnings } = canDoTaskInAlerts(task.type, dayAlerts);
        
        if (!canDo) {
          taskWarnings = [...taskWarnings, ...warnings];
          continue; // 이 날은 건너뛰기
        }
        
        // 이상기후 고려한 최적 시간대 찾기
        let bestSlot;
        if (dayAlerts.length > 0) {
          bestSlot = findSafeTimeSlot(task.type, dayWeather, sunTimes, blockedSlots, dayAlerts);
        } else {
          bestSlot = findBestTimeSlot(task.type, dayWeather, sunTimes, blockedSlots);
        }
        
        if (bestSlot) {
          const duration = task.conditions.duration;
          // 선호 시간이 있으면 그 시간 사용, 없으면 최적 슬롯 사용
          const startHour = task.startHour !== undefined ? task.startHour : bestSlot.hour;
          
          scheduled.push({
            task: task.text,
            taskType: task.type,
            date: dateStr,
            dayIndex: dayIndex,
            dayName: getDayName(dayIndex),
            startHour: startHour,
            endHour: startHour + duration,
            weather: {
              temp: bestSlot.temp,
              humidity: bestSlot.humidity,
              rainChance: bestSlot.rainChance,
              desc: bestSlot.desc,
              isHistorical: dayWeather.isHistorical || false
            },
            weatherSensitive: true,
            detail: task.detail || null,
            alerts: dayAlerts.map(a => ({ type: a.type, name: a.name, color: a.color })),
            conditions: task.conditions
          });
          
          // 해당 시간 블록 추가
          if (!blockedByDate[dateStr]) blockedByDate[dateStr] = [];
          blockedByDate[dateStr].push({
            start: bestSlot.hour,
            end: bestSlot.hour + duration,
            reason: task.text
          });
          
          assigned = true;
        }
      }
      
      // 배치 실패 시 (날씨 조건 불충족 또는 이상기후)
      if (!assigned) {
        let warningMsg = isWeatherSensitive 
          ? '⚠️ 이번 주 적합한 날씨 조건 없음' 
          : '⚠️ 이번 주 가용 시간 없음';
        if (taskWarnings.length > 0) {
          warningMsg = taskWarnings.map(w => `${w.alert}: ${w.reason}`).join(' | ');
        }
        
        scheduled.push({
          task: task.text,
          taskType: task.type,
          date: null,
          dayName: null,
          startHour: null,
          endHour: null,
          weather: null,
          weatherSensitive: isWeatherSensitive,
          conditions: task.conditions,
          warning: warningMsg,
          blockedByAlerts: taskWarnings
        });
      }
    });
    
    // state에 저장
    state.fullWeatherByDate = fullWeatherByDate;
    state.alertsByDate = alertsByDate;
    
    return scheduled;
  }
  
  // =============================================
  // 외부 일정 관리
  // =============================================
  
  function addExternalEvent(event) {
    state.externalEvents.push({
      id: Date.now(),
      name: event.name,
      date: event.date,
      startHour: event.startHour,
      endHour: event.endHour,
      recurring: event.recurring || false,
      recurringDays: event.recurringDays || []
    });
    saveExternalEvents();
    return state.externalEvents;
  }
  
  function removeExternalEvent(id) {
    state.externalEvents = state.externalEvents.filter(e => e.id !== id);
    saveExternalEvents();
    return state.externalEvents;
  }
  
  function saveExternalEvents() {
    localStorage.setItem('shineExternalEvents', JSON.stringify(state.externalEvents));
  }
  
  function loadExternalEvents() {
    const saved = localStorage.getItem('shineExternalEvents');
    if (saved) {
      state.externalEvents = JSON.parse(saved);
    }
    return state.externalEvents;
  }
  
  // =============================================
  // 메인 스케줄링 함수
  // =============================================
  
  async function generateWeeklySchedule(weekData, location = 'Gimcheon', weekNo = 1) {
    state.location = location;
    state.weekStart = getWeekStart();
    state.weekNo = weekNo;
    
    // 주간 작업 목록 수집
    const tasks = [];
    if (weekData && weekData.tasks) {
      weekData.tasks.forEach(t => {
        tasks.push({ text: t, source: 'weekly' });
      });
    }
    
    // 관수 작업 추가
    if (weekData && weekData.water) {
      const waterInterval = weekData.water.interval || 2;
      const waterAmount = weekData.water.amountTon || '3~5톤';
      tasks.push({ 
        text: `💧 관수 (${waterAmount})`, 
        source: 'water',
        taskType: 'WATER',
        weatherSensitive: false,
        preferredDays: [1, 2, 4, 5, 6].filter((d, i) => i % waterInterval === 0),
        startHour: 7,
        duration: 1
      });
    }
    
    // 시비 작업 추가
    if (weekData && weekData.fertilizer) {
      const fert = weekData.fertilizer;
      const fertType = fert.type || '시비';
      const fertAmount = fert.amount || '-';
      const isFertigation = fertType.includes('관주');
      
      tasks.push({ 
        text: `🧪 ${fertType} (${fertAmount})`, 
        source: 'fertilizer',
        taskType: 'FERTILIZER',
        weatherSensitive: false,
        detail: `시비 종류: ${fertType}\n시비량: ${fertAmount}${isFertigation ? '\n관주시비: 관수와 함께 비료 투입' : ''}`,
        startHour: 8,
        duration: 1
      });
    }
    
    // PF농법 추가
    const PF_SCHEDULE = {
      1: { timing: '발아 45일전', pf: 'PF-1', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      2: { timing: '발아 30일전', pf: 'PF-2', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      4: { timing: '발아 15일전', pf: 'PF-4', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      6: { timing: '발아', pf: 'PF-4', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      9: { timing: '개화 15일전', pf: 'PF-1', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      11: { timing: '개화', pf: 'PF-2', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      13: { timing: '개화 15일후', pf: 'PF-4', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' },
      15: { timing: '개화 30일후', pf: 'PF-1', pfAmount: '500g', kit: 'PF-kit', kitAmount: '1kg' },
      17: { timing: '개화 45일후', pf: 'PF-4', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' },
      18: { timing: '개화 50일후', pf: 'PF-2', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' },
      20: { timing: '개화 65일후', pf: 'PF-4', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' },
      22: { timing: '개화 80일후', pf: 'PF-2', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' },
      24: { timing: '개화 95일후', pf: 'PF-4', pfAmount: '250g', kit: 'PF-kit', kitAmount: '500g' }
    };
    
    if (PF_SCHEDULE[weekNo]) {
      const pf = PF_SCHEDULE[weekNo];
      tasks.push({ 
        text: `🦠 PF농법 (${pf.pf} ${pf.pfAmount})`, 
        source: 'pf',
        taskType: 'PF',
        weatherSensitive: true,
        detail: `시기: ${pf.timing}\n${pf.pf}: ${pf.pfAmount}\n${pf.kit}: ${pf.kitAmount}\n사용법: 물 200L당 희석, 토양 관주 또는 엽면 살포`,
        preferredDay: 4, // 목요일
        startHour: 14,
        duration: 1
      });
    }
    
    // 약제 살포 추가 (2주에 1회, 짝수 주차)
    if (weekData && weekData.pest && weekNo % 2 === 0) {
      const pest = weekData.pest;
      const sprayDrug = pest.spray || '예방 약제';
      const watchList = pest.watch?.join(', ') || '-';
      
      tasks.push({ 
        text: `🧴 약제살포 (${sprayDrug.substring(0, 10)}...)`, 
        source: 'spray',
        taskType: 'SPRAY',
        weatherSensitive: true,
        detail: `주의 병해충: ${watchList}\n위험도: ${pest.risk || 'LOW'}\n권장 약제: ${sprayDrug}\n희석배율: 살균제 1,000~2,000배, 살충제 1,000~1,500배`,
        preferredDay: 2, // 화요일
        startHour: 10,
        duration: 2
      });
    }
    
    // 습도관리 작업 추가 (매일 - 연동하우스 기준)
    const HUMIDITY_MANAGEMENT = {
      // 휴면기 (1-4주)
      dormant: { weeks: [1,2,3,4], targetHumidity: '60-70%', ventMode: '최소환기', note: '동해방지 주의' },
      // 발아기 (5-8주)
      budding: { weeks: [5,6,7,8], targetHumidity: '70-80%', ventMode: '결로방지', note: '새벽 환기 필수' },
      // 신초생장기 (9-14주)
      shooting: { weeks: [9,10,11,12,13,14], targetHumidity: '60-70%', ventMode: '적극환기', note: '웃자람 방지' },
      // 개화기 (15-17주)
      flowering: { weeks: [15,16,17], targetHumidity: '50-60%', ventMode: '필수환기', note: '화진 방지 중요!' },
      // 과립비대기 (18-24주)
      fruitGrowth: { weeks: [18,19,20,21,22,23,24], targetHumidity: '60-70%', ventMode: '열과방지', note: '급격한 습도변화 주의' },
      // 착색기 (25-30주)
      coloring: { weeks: [25,26,27,28,29,30], targetHumidity: '50-60%', ventMode: '당도향상', note: '저습도 유지' },
      // 수확기 (31-36주)
      harvest: { weeks: [31,32,33,34,35,36], targetHumidity: '50-60%', ventMode: '품질유지', note: '결로 방지' },
      // 수확후 (37-52주)
      postHarvest: { weeks: [37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52], targetHumidity: '60-70%', ventMode: '최소환기', note: '월동 준비' }
    };
    
    // 현재 주차에 해당하는 습도관리 정보 찾기
    let currentHumidityInfo = null;
    let currentPhaseName = '';
    for (const [phase, info] of Object.entries(HUMIDITY_MANAGEMENT)) {
      if (info.weeks.includes(weekNo)) {
        currentHumidityInfo = info;
        currentPhaseName = phase;
        break;
      }
    }
    
    if (currentHumidityInfo) {
      const phaseNames = {
        dormant: '휴면기',
        budding: '발아기',
        shooting: '신초생장기',
        flowering: '개화기',
        fruitGrowth: '과립비대기',
        coloring: '착색기',
        harvest: '수확기',
        postHarvest: '수확후관리기'
      };
      
      const ventilationDetail = [
        `📊 생육단계: ${phaseNames[currentPhaseName]}`,
        `💧 적정습도: ${currentHumidityInfo.targetHumidity}`,
        `🌬️ 환기모드: ${currentHumidityInfo.ventMode}`,
        `⚠️ 주의: ${currentHumidityInfo.note}`,
        ``,
        `📋 시간대별 환기 (연동하우스):`,
        `  06:00-08:00 | 15°C↑, 80%↑ → 환기팬 ON, 측창 10%`,
        `  09:00-11:00 | 20°C↑, 70%↑ → 측창 30%, 천창 개방`,
        `  12:00-15:00 | 25°C↑ → 측창 50%, 환기팬 ON`,
        `  16:00-18:00 | 20°C↓ → 측창 20%, 천창 폐쇄`,
        `  야간 | 15°C↓, 85%↑ → 환기팬 간헐 가동`,
        ``,
        `🚨 즉시 조치 기준:`,
        `  • 습도 80% 이상 → 즉시 환기`,
        `  • 결로 발생 → 일출 30분 전 환기팬`,
        `  • 비 직후 → 천창만 개방`
      ].join('\n');
      
      // 오전/오후 환기 점검 작업 추가
      tasks.push({ 
        text: `🌬️ 습도관리 (${currentHumidityInfo.targetHumidity})`, 
        source: 'humidity',
        taskType: 'HUMIDITY',
        weatherSensitive: true,
        detail: ventilationDetail,
        preferredDays: [1, 2, 4, 5, 6], // 평일
        startHour: 9,
        duration: 1
      });
    }
    
    // 실시간 날씨 데이터 가져오기 (표시용)
    const weatherData = await fetchWeatherData(location);
    const realtimeWeatherByDate = parseHourlyWeather(weatherData);
    state.realtimeWeatherData = realtimeWeatherByDate;
    
    // 외부 일정 로드
    loadExternalEvents();
    
    // 작업 스케줄링 (작년 데이터 기준으로 배치)
    const scheduled = scheduleTasks(tasks, realtimeWeatherByDate, state.externalEvents, weekNo, true);
    state.scheduledTasks = scheduled;
    
    // 작년 동일 주차 기후 데이터
    const historicalClimate = getHistoricalClimate(weekNo);
    
    return {
      weekStart: state.weekStart,
      weekNo: weekNo,
      realtimeWeatherData: state.realtimeWeatherData, // 실시간 날씨 (표시용)
      fullWeatherByDate: state.fullWeatherByDate, // 작년 데이터 기준 (스케줄링용)
      alertsByDate: state.alertsByDate, // 날짜별 이상기후 알림
      historicalClimate: historicalClimate, // 작년 주차별 평균
      externalEvents: state.externalEvents,
      scheduledTasks: scheduled,
      blockedDays: BLOCKED_DAYS.map(d => getDayName(d))
    };
  }
  
  // =============================================
  // UI 렌더링 헬퍼
  // =============================================
  
  function getWeatherIcon(code) {
    const icons = {
      '113': '☀️', '116': '⛅', '119': '☁️', '122': '☁️',
      '176': '🌦️', '200': '⛈️', '296': '🌧️', '302': '🌧️'
    };
    return icons[code] || '🌤️';
  }
  
  function formatHour(hour) {
    const h = Math.floor(hour);
    return `${h}:00`;
  }
  
  // =============================================
  // 내보내기
  // =============================================
  
  return {
    generateWeeklySchedule,
    addExternalEvent,
    removeExternalEvent,
    loadExternalEvents,
    classifyTask,
    getWeekStart,
    formatDate,
    formatDateFull,
    getDayName,
    isBlockedDay,
    getSunTimes,
    formatHour,
    getHistoricalClimate,
    getWeatherForDate,
    detectWeatherAlerts,
    canDoTaskInAlerts,
    findAvailableHour,
    TASK_CONDITIONS,
    BLOCKED_DAYS,
    DAYS_FULL,
    WEATHER_ALERTS,
    HISTORICAL_HOURLY_CLIMATE,
    getState: () => state
  };
  
})();

// 전역 노출
if (typeof window !== 'undefined') {
  window.WeeklyScheduler = WeeklyScheduler;
}

console.log('🗓️ 주간 스마트 스케줄러 로드 완료');

