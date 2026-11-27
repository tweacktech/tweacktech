/**
 * Python for Data Science
 *
 * Built around the actual workflow: load messy data, clean it, answer a
 * question with a statistic and a chart, then train a model only if a model is
 * the right answer.
 */

const q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const t = (lead, objectives, sections, example, mistakes, practice, summary, questions) => ({
  lead,
  objectives,
  sections,
  example,
  mistakes,
  practice,
  summary,
  questions,
});

const topics = {
  environment: t(
    'Data work fails silently when the environment is wrong: a different pandas version, a stale notebook kernel, or a package installed globally. This lesson sets up an environment you can reproduce.',
    ['create and activate a virtual environment', 'install and pin analysis packages', 'explain why notebooks need a matching kernel'],
    [
      ['Isolate the project', 'A virtual environment gives the project its own site-packages, so upgrading a library for one analysis cannot break another. python -m venv .venv, then activate it, then pip install. Record exact versions with pip freeze > requirements.txt so the analysis runs the same way next month.'],
      ['Kernel, imports and restart', 'A notebook keeps imported modules in memory. After editing a local .py file, an old version stays loaded until you restart the kernel. That is why "it works in the terminal but not the notebook" is almost always a stale kernel, not a data problem.'],
    ],
    {
      lang: 'python',
      code: `python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate

pip install pandas==2.2.3 numpy==2.1.1 matplotlib==3.9.2 scikit-learn==1.5.2
pip freeze > requirements.txt

python -c "import pandas as pd; print(pd.__version__)"`,
      output: '2.2.3',
      explain: 'Pinning versions makes the analysis reproducible on another machine or in CI.',
    },
    [
      'Installing packages globally and then wondering why a colleague gets different results.',
      'Editing a helper module and expecting the notebook to pick it up without restarting the kernel.',
    ],
    {
      prompt: 'Create a fresh environment, install pandas and confirm the version from a script and from the notebook kernel.',
      steps: ['Create and activate the venv.', 'Install and pin the package.', 'Print the version in both places.'],
    },
    [
      'One virtual environment per project keeps versions isolated.',
      'Pin versions for reproducible analysis.',
      'A stale notebook kernel explains most import surprises.',
    ],
    [
      q('Why pin package versions in requirements.txt?',
        'So the analysis runs with the same library behaviour later and elsewhere',
        ['To make imports faster', 'Because pip requires it', 'To reduce disk usage'],
        'Unpinned upgrades change behaviour and results.'),
      q('A notebook still runs old code after you edit a module. What should you do?',
        'Restart the kernel so the module is imported again',
        ['Reinstall pandas', 'Delete the notebook', 'Change the working directory'],
        'Python caches imported modules in memory.'),
    ],
  ),

  numpy: t(
    'NumPy arrays store numbers in contiguous memory and apply operations to all elements at once. Understanding the array is what makes pandas fast rather than mysterious.',
    ['create arrays and inspect shape and dtype', 'use vectorised operations instead of loops', 'explain broadcasting'],
    [
      ['Vectorisation removes the loop', 'A Python loop over a million numbers runs the interpreter a million times. An array operation runs in compiled code once. The result is the same, often fifty times faster, and the code is shorter: prices * 1.2 instead of a comprehension.'],
      ['Shape and broadcasting', 'Every array has a shape, and operations combine shapes by broadcasting: a (1000, 3) array plus a (3,) array adds the row to every row. When shapes cannot align, NumPy raises an error instead of guessing, which is safer than silent misalignment.'],
    ],
    {
      lang: 'python',
      code: `import numpy as np

scores = np.array([[88, 92, 79], [95, 71, 84]])
print(scores.shape, scores.dtype)

curved = scores + 3            # scalar broadcast
weights = np.array([0.4, 0.4, 0.2])
average = (scores * weights).sum(axis=1)

print(curved.tolist())
print(average.round(1))`,
      output: '(2, 3) int64\n[[91, 95, 82], [98, 74, 87]]\n[87.4 85.4]',
      explain: 'axis=1 collapses columns, producing one weighted average per student.',
    },
    [
      'Growing an array in a loop with np.append, which copies the whole array each time.',
      'Confusing axis=0 and axis=1; axis is the dimension being collapsed.',
    ],
    {
      prompt: 'Create a 5x3 array of exam scores and compute a weighted average per student without a loop.',
      steps: ['Build the array with np.array.', 'Multiply by a weight vector.', 'Sum along axis=1.'],
    },
    [
      'Arrays are typed, contiguous and fast.',
      'Vectorised expressions replace Python loops.',
      'Broadcasting aligns shapes; mismatches raise errors.',
    ],
    [
      q('What does axis=1 mean in a sum?',
        'Collapse the columns, producing one value per row',
        ['Collapse the rows', 'Sort the array', 'Transpose the array'],
        'The axis names the dimension being reduced.'),
      q('Why is np.append in a loop slow?',
        'Each call copies the entire array',
        ['It uses too much disk', 'It sorts every time', 'It converts to a list'],
        'Preallocate or build a list and convert once.'),
    ],
  ),

  pandas: t(
    'A DataFrame is a table with named columns and an index. This lesson covers loading data, selecting columns and understanding the difference between a view and a copy.',
    ['load CSV and inspect a DataFrame', 'select rows and columns with loc and iloc', 'avoid the SettingWithCopyWarning'],
    [
      ['loc by label, iloc by position', 'df.loc[df.price > 50, "title"] filters rows by a boolean mask and selects a column by name. df.iloc[0:5, 0:2] selects the first five rows and two columns by position. Mixing them produces off-by-one bugs that are hard to see.'],
      ['Chained assignment', 'df[df.price > 50]["discount"] = 10 assigns to a temporary object, so the original frame is unchanged. Use a single .loc call instead. pandas warns because the behaviour depends on memory layout, which makes the bug intermittent.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("courses.csv")
print(df.shape)
print(df.head(2))

# Filter and select in one step
expensive = df.loc[df["price"] > 50, ["title", "price"]]

# Create a column safely
df.loc[df["price"] > 50, "tier"] = "premium"
df["tier"] = df["tier"].fillna("standard")

print(expensive.sort_values("price", ascending=False).head(1))`,
      output: '(23, 6)\n        title  price\n0  Go Programming  94.99',
      explain: 'loc takes a row condition and a column list, so the assignment targets the original frame.',
    },
    [
      'Using df[condition]["col"] = value, which triggers SettingWithCopyWarning and may not update df.',
      'Assuming the index is a row number after filtering; it keeps the original labels.',
    ],
    {
      prompt: 'Load a CSV, select three columns, filter rows with a condition and add a derived column with loc.',
      steps: ['Read the file and check shape.', 'Filter with a boolean mask.', 'Assign with a single loc call.'],
    },
    [
      'loc selects by label, iloc by position.',
      'Assign through a single loc call to modify the original frame.',
      'Filtering preserves the original index labels.',
    ],
    [
      q('Which accessor selects columns by name?',
        'loc',
        ['iloc', 'at', 'iat'],
        'iloc uses integer positions.'),
      q('Why is chained assignment unreliable?',
        'The intermediate object may be a copy, so the assignment can be lost',
        ['pandas forbids it', 'It is slower', 'It changes the index'],
        'Use one .loc call to target the original frame.'),
    ],
  ),

  'loading-data': t(
    'Real data arrives as CSV, JSON, Excel or a database query, and each format has traps: encodings, delimiters, types inferred from the first rows.',
    ['read CSV, JSON and Excel into DataFrames', 'control dtypes and missing values at load time', 'read a SQL query with pandas'],
    [
      ['Do not trust type inference', 'pandas infers dtypes from the data it sees. A column of postcodes becomes an integer and loses leading zeros; a column with one "N/A" becomes an object. Pass dtype and na_values explicitly for columns that matter.'],
      ['Read in chunks when the file is large', 'A multi-gigabyte CSV does not fit comfortably in memory. chunksize returns an iterator of smaller frames, so you can aggregate as you go. Reading only the columns you need with usecols cuts memory before parsing begins.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv(
    "orders.csv",
    usecols=["order_id", "customer_id", "total", "created_at"],
    dtype={"order_id": "string", "customer_id": "string"},
    na_values=["", "N/A", "NULL"],
    parse_dates=["created_at"],
)

print(df.dtypes)
print(df["created_at"].dt.month.value_counts().sort_index().head(2))`,
      output: 'order_id       string\ncustomer_id    string\ntotal         float64\ncreated_at     datetime64[ns]',
      explain: 'Explicit dtypes keep identifiers as text and dates as dates, which prevents silent corruption.',
    },
    [
      'Letting pandas infer an ID column as int, which strips leading zeros and breaks joins.',
      'Loading every column of a large file when the analysis needs four of them.',
    ],
    {
      prompt: 'Load a CSV with explicit dtypes and a date column, then confirm the dtypes and the date range.',
      steps: ['Specify dtype for identifiers.', 'Parse the date column.', 'Print dtypes and min/max dates.'],
    },
    [
      'Declare dtypes for identifiers and dates at load time.',
      'Use usecols and chunksize for large files.',
      'na_values must include every sentinel the file uses.',
    ],
    [
      q('Why load an order id as string rather than int?',
        'Identifiers are labels, and integers drop leading zeros and lose precision',
        ['Strings are faster', 'pandas cannot store ints', 'It saves memory'],
        'You never do arithmetic on an identifier.'),
      q('What does chunksize do?',
        'Returns an iterator of smaller DataFrames instead of loading the whole file',
        ['Compresses the file', 'Sorts the rows', 'Skips the header'],
        'It keeps memory bounded for large inputs.'),
    ],
  ),

  'missing-data': t(
    'Missing values are not all the same. A blank field, a zero and a sentinel like -1 mean different things, and treating them alike corrupts the analysis.',
    ['detect missing values and their pattern', 'choose between dropping and imputing', 'explain why mean imputation can mislead'],
    [
      ['Understand why it is missing', 'Data missing at random can be imputed; data missing because of the value itself, such as high earners skipping an income question, cannot. Always look at the missingness pattern with isna().sum() and compare groups before filling anything.'],
      ['Impute deliberately', 'Filling with the mean shrinks variance and hides uncertainty. Filling with a median is robust to outliers, and adding a missing-indicator column preserves the information that the value was absent. Dropping rows is fine only when they are few and missing at random.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("survey.csv")
print(df.isna().sum().sort_values(ascending=False).head(3))

df["income_missing"] = df["income"].isna()
df["income"] = df["income"].fillna(df["income"].median())

print(df.groupby("income_missing")["satisfaction"].mean().round(2))`,
      output: 'income         412\nsatisfaction     8\ntenure          21\n\nincome_missing\nFalse    7.4\nTrue     5.9',
      explain: 'The indicator column reveals that respondents who skipped income also report lower satisfaction.',
    },
    [
      'Replacing every missing value with zero, which is a real value and skews every average.',
      'Imputing before splitting train and test data, which leaks test statistics into training.',
    ],
    {
      prompt: 'Take a dataset with missing values, quantify them, and compare the target across missing and present groups.',
      steps: ['Count missing per column.', 'Create an indicator.', 'Compare group means.'],
    },
    [
      'Missingness has a cause and often carries information.',
      'Median imputation is robust; mean imputation shrinks variance.',
      'Never fit imputation on the full dataset before splitting.',
    ],
    [
      q('Why does filling missing values with zero distort an average?',
        'Zero is a real value, so it pulls the mean down as if it were observed',
        ['Zero is not allowed in pandas', 'It changes the dtype', 'It duplicates rows'],
        'Imputation should use a statistic, not an arbitrary constant.'),
      q('What does a missing-indicator column preserve?',
        'The information that the value was absent, which may correlate with the target',
        ['The original value', 'The column order', 'The index'],
        'It lets the model use missingness as a signal.'),
    ],
  ),

  'filtering-grouping': t(
    'Most analysis questions are "which group, how many, how much". Grouping and aggregation answer them directly, without loops.',
    ['filter rows with boolean masks and query', 'aggregate with groupby and named aggregation', 'combine groupby with sort and transform'],
    [
      ['Split, apply, combine', 'groupby splits rows by key, applies a function to each group and combines the results. Named aggregation makes the output columns readable: .agg(orders=("id", "count"), revenue=("total", "sum")).'],
      ['transform keeps the shape', 'agg returns one row per group; transform returns one value per original row, aligned to the index. Use transform for "share of group total" or "difference from group mean", where the result must sit alongside the original rows.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("orders.csv", parse_dates=["created_at"])

summary = (
    df.groupby("category")
      .agg(orders=("order_id", "count"), revenue=("total", "sum"))
      .assign(avg_order=lambda d: (d.revenue / d.orders).round(2))
      .sort_values("revenue", ascending=False)
)

df["share_of_category"] = (
    df["total"] / df.groupby("category")["total"].transform("sum")
).round(3)

print(summary.head(2))`,
      output: '            orders  revenue  avg_order\nBackend       1840  96421.5      52.40\nFrontend      1210  71308.0      58.93',
      explain: 'assign adds a derived column without breaking the chain; transform keeps one value per row.',
    },
    [
      'Iterating over unique values and filtering the frame inside the loop, which is slow and error-prone.',
      'Using agg when the result must align with the original rows; that requires transform.',
    ],
    {
      prompt: 'Compute orders and revenue per category, then each row\'s share of its category total.',
      steps: ['Group and aggregate with named columns.', 'Sort by revenue.', 'Add the share with transform.'],
    },
    [
      'groupby is split, apply, combine.',
      'Named aggregation produces readable output columns.',
      'transform preserves the original row count.',
    ],
    [
      q('When should you use transform instead of agg?',
        'When the result must align with each original row',
        ['When grouping by two columns', 'When sorting', 'When reading a CSV'],
        'transform returns one value per input row.'),
      q('What does named aggregation give you?',
        'Output columns with the names you choose',
        ['Faster grouping', 'Automatic sorting', 'A pivot table'],
        'It makes the resulting frame self-documenting.'),
    ],
  ),

  merging: t(
    'Analyses combine tables: orders with customers, courses with enrolments. The join type decides which rows survive, and a bad key silently multiplies rows.',
    ['choose inner, left, right and outer joins', 'validate a merge with row counts and keys', 'reshape between long and wide format'],
    [
      ['Join type is a question about rows', 'An inner join keeps only matching keys. A left join keeps every row from the left table and fills unmatched columns with NaN, which is what you usually want for a fact table. An outer join keeps everything and is useful for reconciliation.'],
      ['Validate the key', 'If the right table has duplicate keys, a merge produces more rows than you started with, and every downstream total is wrong. Check uniqueness with duplicated().sum() before merging and compare row counts before and after.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

orders = pd.read_csv("orders.csv")
customers = pd.read_csv("customers.csv")

assert not customers["customer_id"].duplicated().any()

merged = orders.merge(
    customers[["customer_id", "country"]],
    on="customer_id",
    how="left",
    validate="many_to_one",
)

print(len(orders), len(merged))
print(merged["country"].isna().sum())`,
      output: '4200 4200\n37',
      explain: 'validate="many_to_one" raises if the right side has duplicate keys, preventing row multiplication.',
    },
    [
      'Merging without checking key uniqueness, so totals silently double.',
      'Using an inner join for a fact table, which drops orders whose customer record is missing.',
    ],
    {
      prompt: 'Merge two tables with a validated many-to-one key and report how many rows failed to match.',
      steps: ['Check key uniqueness.', 'Merge with how="left" and validate.', 'Count missing values in the joined column.'],
    },
    [
      'The join type determines which rows survive.',
      'Duplicate keys multiply rows and corrupt totals.',
      'validate= turns a silent error into an exception.',
    ],
    [
      q('Which join keeps every row from the left table?',
        'A left join',
        ['An inner join', 'A right join', 'A cross join'],
        'Unmatched right-side columns become NaN.'),
      q('What does validate="many_to_one" check?',
        'That the right table has at most one row per key',
        ['That both tables are sorted', 'That no values are missing', 'That dtypes match'],
        'It prevents accidental row multiplication.'),
    ],
  ),

  'time-series': t(
    'Dates are the most commonly mishandled dtype. Strings sort alphabetically, time zones shift totals, and resampling turns transactions into a trend.',
    ['parse dates and extract components', 'resample to a weekly or monthly series', 'handle time zones explicitly'],
    [
      ['Parse once, then use accessors', 'pd.to_datetime converts a string column to datetime64, after which .dt.year, .dt.month and .dt.dayofweek work. Without parsing, filtering by date compares strings, and "2026-9-1" sorts after "2026-10-01".'],
      ['Resample requires a time index', 'set_index("created_at") then .resample("W").sum() produces a weekly series with one row per week, including empty weeks. That regularity is what makes a trend line honest, unlike grouping by a formatted string that skips periods with no data.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("orders.csv", parse_dates=["created_at"])
df["month"] = df["created_at"].dt.to_period("M")

monthly = (
    df.set_index("created_at")
      .resample("MS")["total"]
      .sum()
      .round(2)
)

print(monthly.head(3))
print(df.groupby("month")["total"].sum().idxmax())`,
      output: 'created_at\n2026-01-01    18420.5\n2026-02-01    21004.0\n2026-03-01    19875.25\n2026-02',
      explain: 'resample includes months with no orders as zero, so the series has no gaps.',
    },
    [
      'Storing dates as strings and comparing them lexicographically.',
      'Mixing time zones, so daily totals shift by hours near midnight.',
    ],
    {
      prompt: 'Turn a transaction table into a monthly revenue series and find the best month.',
      steps: ['Parse the date column.', 'Set it as the index.', 'Resample by month and sum.'],
    },
    [
      'Parse dates before filtering or grouping.',
      'resample produces a regular series with no gaps.',
      'Make the time zone explicit when data crosses regions.',
    ],
    [
      q('Why is resample better than grouping by a month string?',
        'It includes periods with no data, so the series has no gaps',
        ['It is faster', 'It sorts automatically', 'It handles time zones'],
        'Gaps distort trend lines and growth rates.'),
      q('What does .dt.month return?',
        'The month number for each datetime value',
        ['The month name', 'A string', 'The number of months between rows'],
        'The accessor exposes date components after parsing.'),
    ],
  ),

  plotting: t(
    'A chart is an argument. This lesson covers choosing the right chart for the question and removing everything that does not support the argument.',
    ['choose a chart type for comparison, distribution and trend', 'label axes and units', 'avoid misleading scales and dual axes'],
    [
      ['Chart type follows the question', 'Comparison across categories: bar chart. Distribution of one variable: histogram or box plot. Relationship between two variables: scatter plot. Change over time: line chart. A pie chart with twelve slices answers nothing, and a line chart implies continuity that categorical data does not have.'],
      ['Honest axes', 'A bar chart must start at zero because the bar length encodes the value. A line chart of a stock price may start elsewhere because the position, not the length, encodes the value. Truncated bar axes exaggerate differences; dual y-axes invite false correlations.'],
    ],
    {
      lang: 'python',
      code: `import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("courses.csv")

fig, ax = plt.subplots(figsize=(7, 4))
top = df.nlargest(6, "enrolments").sort_values("enrolments")
ax.barh(top["title"], top["enrolments"], color="#2563eb")
ax.set_xlabel("Enrolled students")
ax.set_title("Six most popular courses")
ax.spines[["top", "right"]].set_visible(False)

plt.tight_layout()
plt.savefig("top-courses.png", dpi=150)`,
      output: 'Saved top-courses.png (1050x600 px)',
      explain: 'A horizontal bar chart keeps long course titles readable and starts the axis at zero.',
    },
    [
      'Using a pie chart for more than four categories, where the slices become impossible to compare.',
      'Truncating a bar chart axis to make a small difference look dramatic.',
    ],
    {
      prompt: 'Take one question about a dataset and choose a chart type, then justify the choice in one sentence.',
      steps: ['Write the question.', 'Name the variable types.', 'Pick the chart and label both axes with units.'],
    },
    [
      'The question decides the chart type.',
      'Bars encode length, so they start at zero.',
      'Remove decoration that does not support the argument.',
    ],
    [
      q('Which chart shows the distribution of a single numeric variable?',
        'A histogram',
        ['A pie chart', 'A line chart', 'A stacked bar'],
        'It bins the values and shows frequency per bin.'),
      q('Why must a bar chart axis start at zero?',
        'The bar length encodes the value, so truncation distorts the comparison',
        ['It is a library requirement', 'It improves colour contrast', 'It makes labels fit'],
        'Line charts can truncate because position encodes the value.'),
    ],
  ),

  statistics: t(
    'Summary statistics compress a dataset into a few numbers, and every one of them can mislead. This lesson covers the ones worth reporting and when they hide the shape of the data.',
    ['choose between mean and median', 'describe spread with standard deviation and quartiles', 'explain what a p-value does and does not mean'],
    [
      ['Centre and spread together', 'A mean without a standard deviation hides whether the values cluster or span a huge range. Report the median and interquartile range for skewed data such as income or session length, where a few large values drag the mean away from the typical case.'],
      ['Significance is not importance', 'A p-value estimates how surprising the data would be if there were no effect. A tiny effect becomes significant with a large sample, so report the effect size and a confidence interval alongside it. Statistical significance is not practical importance.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("sessions.csv")
duration = df["minutes"]

print("mean", round(duration.mean(), 1))
print("median", round(duration.median(), 1))
print("iqr", duration.quantile([0.25, 0.75]).round(1).tolist())
print("skew", round(duration.skew(), 2))

# Compare two groups with an effect size, not just a p-value
a = df.loc[df["variant"] == "A", "minutes"]
b = df.loc[df["variant"] == "B", "minutes"]
print("difference in medians", round(b.median() - a.median(), 1))`,
      output: 'mean 14.8\nmedian 8.2\niqr [3.1, 16.4]\nskew 3.41\ndifference in medians 2.4',
      explain: 'The mean is nearly double the median and skew is high, so the median and IQR describe the typical session.',
    },
    [
      'Reporting a mean for heavily skewed data and calling it "the average user".',
      'Treating p < 0.05 as proof that an effect is large or important.',
    ],
    {
      prompt: 'Compare two groups in a dataset using median, IQR and an effect size, and explain which group is practically better.',
      steps: ['Plot or summarise both distributions.', 'Report median and IQR.', 'State the effect size in the units of the problem.'],
    },
    [
      'Report centre and spread together.',
      'Use median and IQR for skewed data.',
      'Significance answers a different question from importance.',
    ],
    [
      q('When is the median a better summary than the mean?',
        'When the data is skewed or has extreme outliers',
        ['When the sample is large', 'When values are normally distributed', 'When the data is categorical'],
        'The median resists being pulled by a few large values.'),
      q('What does a p-value tell you?',
        'How likely the data would be if there were no real effect',
        ['The size of the effect', 'The probability the hypothesis is true', 'The chance of a bug'],
        'It is not the probability that the result is correct.'),
    ],
  ),

  correlation: t(
    'Correlation measures how two variables move together, and it is routinely confused with causation and with usefulness. This lesson covers what a correlation coefficient actually says.',
    ['interpret Pearson and Spearman correlation', 'recognise confounding and Simpson\'s paradox', 'decide when correlation is enough for a decision'],
    [
      ['Linear and monotonic', 'Pearson measures the strength of a linear relationship and is sensitive to outliers. Spearman ranks the values first, so it captures any monotonic relationship and resists outliers. A Pearson of zero does not mean no relationship, only no linear one.'],
      ['Confounding', 'Ice cream sales correlate with drowning deaths because both follow temperature. A third variable drives both. Simpson\'s paradox is the extreme case where a trend reverses when groups are combined, so always plot the subgroups before concluding.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("courses.csv")

print(df[["hours", "score"]].corr(method="pearson").round(2))
print(df[["hours", "score"]].corr(method="spearman").round(2))

# Check whether the relationship holds within each level
print(df.groupby("level")[["hours", "score"]].corr().round(2))`,
      output: '          hours  score\nhours      1.00   0.62\nscore      0.62   1.00\n\nlevel       Beginner  Intermediate\nhours           0.71          0.18',
      explain: 'The overall correlation hides that the relationship is strong for beginners and weak for intermediates.',
    },
    [
      'Concluding that more study time causes higher scores from an observational correlation.',
      'Reporting a single pooled correlation without checking subgroups.',
    ],
    {
      prompt: 'Compute Pearson and Spearman correlations for two variables, then check whether the relationship holds in each subgroup.',
      steps: ['Compute both coefficients.', 'Group by a plausible confounder.', 'Compare the within-group correlations.'],
    },
    [
      'Pearson is linear; Spearman is monotonic and rank-based.',
      'A third variable can create or reverse an apparent relationship.',
      'Always inspect subgroups before concluding.',
    ],
    [
      q('What does a Spearman correlation measure?',
        'The strength of a monotonic relationship between ranked values',
        ['Only linear relationships', 'Causation', 'The mean difference'],
        'Ranking makes it robust to outliers and non-linear monotonic curves.'),
      q('What is a confounder?',
        'A third variable that influences both variables being compared',
        ['An outlier', 'A missing value', 'A duplicate row'],
        'It can create a correlation with no direct causal link.'),
    ],
  ),

  'sampling': t(
    'A sample is only useful if it represents the population. This lesson covers sampling methods, the standard error and why a biased sample cannot be fixed by collecting more data.',
    ['distinguish random, stratified and convenience samples', 'interpret a confidence interval', 'explain how sample size affects precision'],
    [
      ['Bias does not shrink with n', 'A convenience sample, such as users who answered a pop-up, over-represents people with strong opinions. Collecting a million of those responses makes the estimate more precise and just as wrong. Random selection is what makes an estimate generalise.'],
      ['Precision versus confidence', 'A 95% confidence interval means that if you repeated the sampling procedure many times, about 95% of the intervals would contain the true value. It does not mean there is a 95% chance the true value is in this particular interval, which is the most common misreading.'],
    ],
    {
      lang: 'python',
      code: `import numpy as np

rng = np.random.default_rng(42)
population = rng.normal(50, 12, 100_000)

sample = rng.choice(population, size=400, replace=False)
mean = sample.mean()
standard_error = sample.std(ddof=1) / np.sqrt(len(sample))

low, high = mean - 1.96 * standard_error, mean + 1.96 * standard_error
print(round(mean, 2), (round(low, 2), round(high, 2)))`,
      output: '49.87 (48.69, 51.05)',
      explain: 'The interval narrows with the square root of the sample size, not linearly.',
    },
    [
      'Assuming a larger convenience sample fixes selection bias.',
      'Reporting a confidence interval without saying what procedure it assumes.',
    ],
    {
      prompt: 'Draw two samples of different sizes from the same population and compare the width of their confidence intervals.',
      steps: ['Sample 100 and 1000 values.', 'Compute the standard error for each.', 'Compare the interval widths.'],
    },
    [
      'Random selection is what allows generalisation.',
      'Precision improves with the square root of n.',
      'A confidence interval describes the procedure, not a single interval.',
    ],
    [
      q('What happens to a biased estimate as the sample grows?',
        'It becomes more precise but remains biased',
        ['It becomes unbiased', 'It converges to the true value', 'It becomes a confidence interval'],
        'More data does not fix a selection problem.'),
      q('How does precision improve with sample size?',
        'Proportional to the square root of n',
        ['Linearly with n', 'It does not improve', 'Exponentially with n'],
        'Quadrupling the sample halves the standard error.'),
    ],
  ),

  'sklearn-workflow': t(
    'A scikit-learn model is always the same three calls: fit, predict and score. This lesson covers the workflow and the split that keeps evaluation honest.',
    ['split data into train and test sets', 'fit a pipeline with preprocessing and a model', 'predict and score on held-out data'],
    [
      ['Split before you touch anything', 'If you scale, impute or select features using the whole dataset, information from the test set leaks into training and the score is optimistic. Split first, then fit every transformation on the training data only, ideally inside a Pipeline.'],
      ['Pipelines make preprocessing portable', 'A Pipeline chains imputation, scaling and the estimator, so the exact same transformations are applied at training and prediction time. Without it, a missing scaling step in production is invisible until the predictions are wrong.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

df = pd.read_csv("students.csv")
X = df[["hours", "prior_score", "sessions"]]
y = df["passed"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y,
)

model = Pipeline([
    ("impute", SimpleImputer(strategy="median")),
    ("scale", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])

model.fit(X_train, y_train)
predictions = model.predict(X_test)
print(round(accuracy_score(y_test, predictions), 3))`,
      output: '0.842',
      explain: 'Every preprocessing step is fitted on the training split and reused unchanged on the test split.',
    },
    [
      'Scaling the full dataset before splitting, which leaks test information into training.',
      'Reporting training accuracy as if it were performance on new data.',
    ],
    {
      prompt: 'Build a pipeline with imputation, scaling and a classifier, then compare training and test accuracy.',
      steps: ['Split with stratify.', 'Fit the pipeline on train.', 'Score on both splits and explain the gap.'],
    },
    [
      'Split first, then fit transformations on training data only.',
      'Pipelines keep preprocessing identical in training and production.',
      'Test accuracy estimates generalisation; training accuracy does not.',
    ],
    [
      q('Why is scaling before the split a problem?',
        'The scaler sees test data, leaking information into training',
        ['It makes training slower', 'It changes the labels', 'It removes rows'],
        'Leakage produces an optimistic score that does not generalise.'),
      q('What does a Pipeline guarantee?',
        'The same preprocessing is applied at fit and predict time',
        ['A higher accuracy', 'Faster training', 'No missing values'],
        'It removes the risk of a step being forgotten in production.'),
    ],
  ),

  evaluation: t(
    'Accuracy is misleading when classes are imbalanced. This lesson covers the confusion matrix and the metrics that answer the question you actually asked.',
    ['read a confusion matrix', 'choose between precision, recall and F1', 'explain why accuracy fails on imbalanced data'],
    [
      ['Four outcomes, not one number', 'A confusion matrix counts true positives, false positives, true negatives and false negatives. Precision is TP / (TP + FP): when the model says yes, how often is it right. Recall is TP / (TP + FN): of the real positives, how many were found.'],
      ['Choose the cost of mistakes', 'A spam filter can tolerate false positives less than false negatives, so precision matters. A disease screen prefers recall, because missing a case is worse than a false alarm. Accuracy hides both, especially when 95% of cases are negative.'],
    ],
    {
      lang: 'python',
      code: `from sklearn.metrics import classification_report, confusion_matrix

print(confusion_matrix(y_test, predictions))
print(classification_report(y_test, predictions, digits=3))

# accuracy vs baseline
print("baseline (always negative):", round(1 - y_test.mean(), 3))`,
      output: '[[118  12]\n [ 19  51]]\n              precision    recall  f1-score   support\n           0      0.861     0.908     0.884       130\n           1      0.810     0.729     0.767        70\n\nbaseline (always negative): 0.650',
      explain: 'The model beats the 65% baseline, and the per-class recall shows it misses 27% of positives.',
    },
    [
      'Reporting accuracy on a dataset where 95% of rows are one class.',
      'Optimising precision and recall separately without acknowledging the trade-off.',
    ],
    {
      prompt: 'Compute a confusion matrix for a classifier and state which error costs more in that domain.',
      steps: ['Generate predictions.', 'Print the matrix.', 'Justify precision or recall as the primary metric.'],
    },
    [
      'The confusion matrix is the source of every classification metric.',
      'Precision and recall trade off against each other.',
      'Compare against a trivial baseline before celebrating accuracy.',
    ],
    [
      q('What does recall measure?',
        'The share of real positives that the model found',
        ['The share of predicted positives that are correct', 'Overall accuracy', 'The false positive rate'],
        'Recall is TP / (TP + FN).'),
      q('Why is accuracy a poor metric for fraud detection?',
        'Fraud is rare, so predicting "not fraud" always scores high',
        ['Accuracy is undefined for binary problems', 'Fraud data has no labels', 'It requires a confusion matrix'],
        'A trivial baseline can look excellent while catching nothing.'),
    ],
  ),

  overfitting: t(
    'A model that memorises training data fails on new data. This lesson covers the bias-variance trade-off and the tools that keep a model honest.',
    ['recognise overfitting and underfitting', 'use cross-validation instead of a single split', 'regularise a model and tune it with a grid search'],
    [
      ['The gap is the signal', 'High training accuracy with low validation accuracy means the model memorised noise. Low scores on both mean it is too simple or the features are uninformative. Plotting both curves against model complexity shows where the gap opens.'],
      ['Cross-validation and regularisation', 'K-fold cross-validation trains K models on different splits, so the estimate does not depend on one lucky split. Regularisation penalises large coefficients, shrinking the model towards simplicity; the strength is a hyperparameter tuned on validation folds, never on the test set.'],
    ],
    {
      lang: 'python',
      code: `from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.tree import DecisionTreeClassifier

tree = DecisionTreeClassifier(random_state=42)
for depth in [2, 5, None]:
    tree.set_params(max_depth=depth)
    scores = cross_val_score(tree, X_train, y_train, cv=5, scoring="f1")
    print(depth, round(scores.mean(), 3), round(scores.std(), 3))

search = GridSearchCV(tree, {"max_depth": [2, 3, 5, 8]}, cv=5, scoring="f1")
search.fit(X_train, y_train)
print(search.best_params_, round(search.best_score_, 3))`,
      output: '2 0.74 0.02\n5 0.81 0.03\nNone 0.86 0.01\n{max_depth: 5} 0.81',
      explain: 'Test-set performance is not consulted during the search; the best depth is chosen on validation folds.',
    },
    [
      'Tuning hyperparameters on the test set, which turns it into another training set.',
      'Choosing a model by its training score, which always favours the most overfitted model.',
    ],
    {
      prompt: 'Compare an unconstrained tree with a depth-limited tree using cross-validation and explain the difference.',
      steps: ['Score both with 5-fold CV.', 'Report mean and standard deviation.', 'Pick the simpler model if the scores are close.'],
    },
    [
      'A large train-validation gap indicates overfitting.',
      'Cross-validation reduces dependence on one split.',
      'Tune on validation folds; touch the test set once.',
    ],
    [
      q('What does a large gap between training and validation scores indicate?',
        'Overfitting: the model has memorised training noise',
        ['Underfitting', 'A data leak', 'A broken metric'],
        'It performs well on seen data and poorly on unseen data.'),
      q('Why must hyperparameters not be tuned on the test set?',
        'The test set would stop being an unbiased estimate of generalisation',
        ['It is too small', 'It causes overfitting of the test set only', 'The library forbids it'],
        'Tuning on test data leaks information into model selection.'),
    ],
  ),

  capstone: t(
    'The capstone is an end-to-end analysis: a question, a cleaned dataset, one chart, one statistic and, where appropriate, one model with an honest evaluation.',
    ['turn a business question into an analysis plan', 'document data cleaning decisions', 'report a result with uncertainty and limitations'],
    [
      ['Question first, method second', 'Write the question and the decision it informs before opening the data. "Do learners who start on mobile complete less often?" implies a comparison of completion rates by device with a confidence interval. Without the question, analysis becomes a tour of whatever the columns allow.'],
      ['Report limitations', 'State how many rows were dropped and why, which groups are under-represented, and what the analysis cannot conclude. A result with a clear limitation is more trustworthy than a confident number with no caveats, because the reader can judge how far to apply it.'],
    ],
    {
      lang: 'python',
      code: `import pandas as pd

df = pd.read_csv("enrolments.csv", parse_dates=["started_at"])
rows_before = len(df)

df = df.dropna(subset=["completed", "device"])
df = df[df["started_at"] >= "2026-01-01"]

completion = (
    df.groupby("device")["completed"]
      .agg(["mean", "count"])
      .rename(columns={"mean": "completion_rate", "count": "learners"})
      .round(3)
      .sort_values("completion_rate", ascending=False)
)

print("dropped", rows_before - len(df))
print(completion)`,
      output: 'dropped 412\n          completion_rate  learners\nDesktop             0.612      2840\nMobile              0.487      3910',
      explain: 'The dropped-row count is part of the result, because it bounds how much the comparison can be trusted.',
    },
    [
      'Dropping rows silently and reporting a rate on a subset that is no longer representative.',
      'Presenting a difference without a confidence interval or a sample size.',
    ],
    {
      prompt: 'Write the question, the cleaning plan and the report structure for your own dataset before running any code.',
      steps: ['State the decision the analysis informs.', 'List the exclusions and why.', 'Define the metric and the uncertainty you will report.'],
    },
    [
      'The question determines the method and the metric.',
      'Document every exclusion with a count.',
      'Report uncertainty and limitations alongside the result.',
    ],
    [
      q('Why report the number of dropped rows?',
        'Exclusions change who the result describes, so the reader can judge representativeness',
        ['pandas requires it', 'It improves accuracy', 'It reduces file size'],
        'Silent exclusions are a common source of misleading results.'),
      q('What should an analysis report alongside a difference between groups?',
        'A measure of uncertainty and the sample size',
        ['Only the p-value', 'A second chart', 'The raw data'],
        'The effect size and interval show whether the difference is meaningful.'),
    ],
  ),
};

module.exports = {
  slug: 'python-data-science',
  title: 'Python for Data Science',
  shortDescription:
    'Load, clean, visualise and model real data with pandas, NumPy and scikit-learn — and report results honestly.',
  description:
    'A hands-on data science course built around the real workflow rather than a tour of libraries. You will set up a reproducible environment, work with NumPy arrays and pandas DataFrames, clean messy data, join and reshape tables, analyse time series, choose honest charts and statistics, and train and evaluate a model without leaking data. The capstone is a complete analysis with a documented question, cleaning decisions and limitations.',
  level: 'Beginner',
  price: 10,
  duration: '10 weeks',
  featured: false,
  outcomes: [
    'Set up a reproducible Python analysis environment',
    'Load and type data correctly from CSV, JSON and SQL',
    'Clean missing and malformed data without distorting results',
    'Join, group and reshape tables with pandas',
    'Analyse time series with resampling',
    'Choose charts and statistics that answer the question',
    'Train and evaluate a model without data leakage',
    'Report findings with uncertainty and limitations',
  ],
  requirements: [
    'Basic Python syntax: variables, lists, functions and loops',
    'Comfort using a terminal',
    'No statistics or machine learning background required',
  ],
  targetAudience:
    'Analysts, developers and career changers who need to turn raw data into a defensible answer.',
  modules: [
    {
      title: 'Module 1: Tools and data structures',
      description: 'Build a reproducible environment and learn the two data structures everything else uses.',
      check: [
        q('A notebook imports a helper module you just edited but runs the old code. What is the cause?',
          'The kernel still holds the previously imported module in memory',
          ['The file is read-only', 'pandas caches imports', 'The virtual environment is missing'],
          'Restart the kernel to re-import.'),
        q('Why is an explicit dtype important for an identifier column?',
          'Inference can turn an identifier into a number and lose leading zeros',
          ['Strings take less memory', 'pandas cannot store integers', 'It improves plotting'],
          'Identifiers are labels; no arithmetic should apply to them.'),
      ],
      lessons: [
        { title: 'A reproducible analysis environment', objective: 'Create an isolated, pinned Python environment.', topic: 'environment', minutes: 20 },
        { title: 'NumPy arrays and vectorisation', objective: 'Work with shapes and broadcast operations.', topic: 'numpy', minutes: 30 },
        { title: 'pandas DataFrames', objective: 'Load, select and modify tabular data safely.', topic: 'pandas', minutes: 35 },
        { title: 'Loading real data', objective: 'Control dtypes, dates and missing sentinels at load time.', topic: 'loading-data', minutes: 25 },
      ],
    },
    {
      title: 'Module 2: Cleaning and shaping',
      description: 'Handle missing values, group and join tables, and turn timestamps into a trend.',
      check: [
        q('Why is filling missing numeric values with zero usually wrong?',
          'Zero is a real value and biases the mean',
          ['Zero breaks the dtype', 'pandas cannot store zero', 'It creates duplicate rows'],
          'Use a statistic plus an indicator column instead.'),
        q('A merge produces more rows than the left table. What happened?',
          'The right table has duplicate keys, multiplying matches',
          ['The join type was outer', 'A column name collided', 'The index was reset'],
          'Check key uniqueness before merging.'),
      ],
      lessons: [
        { title: 'Missing data', objective: 'Diagnose missingness and impute deliberately.', topic: 'missing-data', minutes: 30 },
        { title: 'Filtering and grouping', objective: 'Answer group-level questions without loops.', topic: 'filtering-grouping', minutes: 30 },
        { title: 'Joining and reshaping tables', objective: 'Combine tables without multiplying rows.', topic: 'merging', minutes: 30 },
        { title: 'Time series with resampling', objective: 'Turn transactions into a regular trend.', topic: 'time-series', minutes: 30 },
      ],
    },
    {
      title: 'Module 3: Charts and statistics',
      description: 'Choose a chart and a statistic that answer the question without misleading the reader.',
      check: [
        q('Which axis rule applies to bar charts?',
          'The value axis must start at zero',
          ['It must start at the minimum value', 'It must be logarithmic', 'It must be inverted'],
          'Bar length encodes the value, so truncation exaggerates differences.'),
        q('A correlation disappears within every subgroup. What does that suggest?',
          'A confounder or Simpson\'s paradox is driving the pooled result',
          ['The data is corrupted', 'The correlation is causal', 'The sample is too small'],
          'Always inspect subgroups before interpreting a pooled correlation.'),
      ],
      lessons: [
        { title: 'Charts that make the point', objective: 'Match chart type to question and keep axes honest.', topic: 'plotting', minutes: 30 },
        { title: 'Summary statistics that do not mislead', objective: 'Report centre, spread and effect size together.', topic: 'statistics', minutes: 30 },
        { title: 'Correlation and confounding', objective: 'Interpret correlation without claiming causation.', topic: 'correlation', minutes: 25 },
        { title: 'Sampling and uncertainty', objective: 'Explain what a confidence interval does and does not say.', topic: 'sampling', minutes: 25 },
      ],
    },
    {
      title: 'Module 4: Machine learning and reporting',
      description: 'Train, evaluate and report a model, then deliver a complete analysis.',
      check: [
        q('Why split the data before scaling or imputing?',
          'Fitting on the full dataset leaks test information into training',
          ['Scaling is slow', 'It changes the labels', 'The model needs the full dataset'],
          'Every transformation must be fitted on training data only.'),
        q('A model has 0.98 training accuracy and 0.61 validation accuracy. What is happening?',
          'It is overfitting the training data',
          ['It is underfitting', 'The metric is inverted', 'The data is balanced'],
          'The gap between the two scores is the signal.'),
      ],
      lessons: [
        { title: 'The scikit-learn workflow', objective: 'Build a leakage-free pipeline from split to prediction.', topic: 'sklearn-workflow', minutes: 35 },
        { title: 'Evaluation metrics', objective: 'Read a confusion matrix and choose precision or recall.', topic: 'evaluation', minutes: 30 },
        { title: 'Overfitting and regularisation', objective: 'Use cross-validation and tuning honestly.', topic: 'overfitting', minutes: 30 },
        { title: 'Capstone: an end-to-end analysis', objective: 'Deliver a question, a result and its limitations.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
