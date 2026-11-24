import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickCheckPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Quick Check"
        subtitle="Check eligibility across top central and state schemes in under 60 seconds with 3 core inputs."
        backHref="/"
        backLabel="Home"
      />

      <Card>
        <CardHeader>
          <CardTitle>Rapid Triage</CardTitle>
          <CardDescription>
            These criteria establish the baseline for general income thresholds and academic levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Select
              label="Education Level"
              options={[
                { value: 'undergraduate', label: 'Undergraduate (BE/BTech, BSc, BCom, BA)' },
                { value: 'postgraduate', label: 'Postgraduate (ME/MTech, MSc, MBA)' },
                { value: 'diploma', label: 'Polytechnic / Diploma' },
                { value: 'class11_12', label: 'Class 11–12 (PUC / Higher Secondary)' },
              ]}
              defaultValue="undergraduate"
              whyWeAsk="Schemes are categorized strictly by level of study."
            />

            <Input
              label="Annual Family Income (₹)"
              type="number"
              placeholder="e.g. 200000"
              whyWeAsk="Most government scholarships enforce hard family income limits (e.g. ₹2.5L or ₹8L)."
            />

            <Select
              label="Social Category"
              options={[
                { value: 'sc', label: 'SC (Scheduled Caste)' },
                { value: 'st', label: 'ST (Scheduled Tribe)' },
                { value: 'obc', label: 'OBC (Other Backward Classes)' },
                { value: 'general', label: 'General / Unreserved' },
                { value: 'minority', label: 'Religious Minority (Muslim, Christian, Sikh, Jain, Buddhist, Parsi)' },
              ]}
              defaultValue="general"
              whyWeAsk="Specific welfare departments administer separate targeted schemes."
            />

            <div className="pt-2">
              <Link to="/home">
                <Button fullWidth size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Evaluate Instant Matches
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
