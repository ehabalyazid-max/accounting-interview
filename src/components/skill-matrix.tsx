type Skill = {
  label: string;
  value: number;
};

export function SkillMatrix({ skills, title = 'مصفوفة المهارات المحاسبية' }: { skills: Skill[]; title?: string }) {
  return (
    <section className="statement-panel">
      <div className="statement-header">
        <p className="text-xs font-bold tracking-wide text-[#667085]">{title}</p>
      </div>
      <div className="p-4">
        {skills.map((skill) => (
          <div className="skill-row" key={skill.label}>
            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#0f1f33]">{skill.label}</span>
                <span className="numeric font-bold text-[#1f7a5a]">{skill.value}%</span>
              </div>
              <div className="skill-bar" role="progressbar" aria-valuenow={skill.value} aria-valuemin={0} aria-valuemax={100}>
                <div className="skill-fill" style={{ width: `${skill.value}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
