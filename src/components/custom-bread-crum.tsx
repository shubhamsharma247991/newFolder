import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

interface CustomBreadCrumbProps {
  breadCrumbPage: string;
  breadCrumbItems: {
    label: string;
    link: string;
  }[];
}

export const CustomBreadCrumb = ({
  breadCrumbPage,
  breadCrumbItems,
}: CustomBreadCrumbProps) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link to="/">
            <BreadcrumbLink className="flex items-center justify-center hover:text-emerald-500">
              <Home className="w-3 h-3 mr-2" />
              Home
            </BreadcrumbLink>
          </Link>
        </BreadcrumbItem>

        {breadCrumbItems?.map((item, i) => (
          <React.Fragment key={i}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link to={item.link}>
                <BreadcrumbLink className="hover:text-emerald-500">
                  {item.label}
                </BreadcrumbLink>
              </Link>
            </BreadcrumbItem>
          </React.Fragment>
        ))}

        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{breadCrumbPage}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
