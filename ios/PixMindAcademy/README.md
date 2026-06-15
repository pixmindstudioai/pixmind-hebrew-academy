# PixMind Academy iOS

אפליקציית iOS native שמריצה את אתר האקדמיה הקיים בתוך מעטפת iOS אמיתית.

האתר נשאר המקור האמיתי:

- הדפים, העיצוב, RTL, מובייל, פיד, קורסים, פרופיל וניהול מגיעים מה־React/Vite web app.
- ההתחברות ממשיכה לעבוד דרך Supabase Auth של האתר.
- הדאטה ממשיך להגיע מ־Supabase דרך הקוד הקיים באתר.
- אין שכפול של כל המסכים ל־SwiftUI.

האפליקציה היא shell native:

- פרויקט Xcode: `ios/PixMindAcademy/PixMindAcademy.xcodeproj`.
- אפליקציית SwiftUI בשם `PixMindAcademy`.
- בתוך SwiftUI יש `WKWebView`, הדפדפן native של iOS לאפליקציות.
- ה־WebView טוען את האתר ומציג אותו כאפליקציית iOS.

מה יש מסביב:

- מסך טעינה native עם הלוגו הקיים.
- App Icon מהלוגו הקיים.
- Launch Screen עם רקע כהה ולוגו.
- גלילה תקינה בתוך הדפים.
- Pull to refresh.
- קישורים חיצוניים נפתחים מחוץ לאפליקציה.
- הרשאות מצלמה, תמונות ומיקרופון כדי שהעלאות באתר יעבדו מתוך האפליקציה.
- Deep link schemes: `pixmindacademy://` וגם `clawsacademy://`.

## URLs

הכתובת מוגדרת ב־`PixMindAcademy/WebShellConfig.swift`.

- `Debug`: `http://127.0.0.1:8080`
- `Release`: `https://pixmind-hebrew-academy.vercel.app`

אם דומיין ה־production שונה, משנים רק את `startURL` בקובץ הזה.

## הרצה מקומית

קודם מריצים את האתר:

```bash
npm run dev
```

בפרויקט הזה Vite מוגדר על port `8080`, ולכן האפליקציה ב־Debug טוענת:

```txt
http://127.0.0.1:8080
```

אחר כך פותחים את Xcode:

```bash
open ios/PixMindAcademy/PixMindAcademy.xcodeproj
```

ומריצים את הסכמה `PixMindAcademy` על iPhone Simulator.

אפשר גם לבנות מהטרמינל:

```bash
xcodebuild \
  -project ios/PixMindAcademy/PixMindAcademy.xcodeproj \
  -scheme PixMindAcademy \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -derivedDataPath /tmp/pixmind-ios-dd \
  ONLY_ACTIVE_ARCH=YES ARCHS=arm64 build
```

## DB Health

נוסף endpoint:

```txt
/api/health/db
```

ב־Vite dev server הוא מוגש דרך plugin ב־`vite.config.ts`.
בפריסה שתומכת בתיקיית `api`, קיים גם `api/health/db.ts`.

הבדיקה מבצעת קריאת REST קצרה ל־Supabase ומחזירה JSON עם `ok`, `status`, `supabaseUrl`, ו־`checkedAt`.
